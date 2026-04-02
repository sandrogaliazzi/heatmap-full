import net from "net";
import dotenv from "dotenv";
import Auditoria from "../models/auditoriaModel.js";
import oltModel from "../models/oltModel.js";
dotenv.config();

function parseOnuLine(line) {
  // Exemplo: "01  AN5506-01-A1    ITBScf91b114  123456789   admin, admin"
  const parts = line.split(/\s+/).filter((part) => part.trim() !== "");

  if (parts.length >= 4) {
    return {
      onuNumber: parts[0],
      type: parts[1],
      mac: parts[2],
      password: parts[3],
      serial: parts.length > 4 ? parts.slice(4).join(" ") : "",
    };
  }

  return null;
}

function formatVlan(slot, pon) {
  let vlan = "";
  vlan = `1${slot}${pon}`;
  if (vlan.length < 4) {
    vlan = `10${slot}${pon}`;
  }

  return vlan;
}

function parseOnuListFromUnm(tl1Output) {
  const lines = tl1Output.split("\n");
  const results = [];

  for (const line of lines) {
    if (line.startsWith("192.168.")) {
      const cols = line.trim().split(/\s{2,}|\t+/);
      const oltIp = cols[0];
      const ponidParts = cols[1].split("-");
      const slot = ponidParts[ponidParts.length - 2];
      const pon = ponidParts[ponidParts.length - 1];

      results.push({
        onuNumber: cols[2]?.trim(),
        name: cols[3]?.trim().split(" ").join("-"),
        mac: cols[8]?.trim(),
        flowProfile: `bridge_vlan_${formatVlan(slot, pon)}`,
        slot: slot,
        pon: pon,
        oltIp: oltIp,
      });
    }
  }

  return results;
}

function processDiscoveryData(bufferData) {
  let dataObjects = [];
  let currentSlot = null;
  let currentPon = null;
  const lines = bufferData.split(/\r?\n/).map((line) => line.trim());

  for (let line of lines) {
    if (line.includes("SLOT=") && line.includes("PON=")) {
      const slotMatch = line.match(/SLOT=(\d+)/);
      const ponMatch = line.match(/PON=(\d+)/);
      currentSlot = slotMatch ? slotMatch[1] : null;
      currentPon = ponMatch ? ponMatch[1] : null;
    }

    if (/^\d+\s+\S+/.test(line) && currentSlot && currentPon) {
      const onuData = parseOnuLine(line);
      if (onuData) {
        dataObjects.push({
          slot: currentSlot,
          gpon: currentPon,
          oltIp: process.env.FIBERHOME_HOST,
          oltName: "FIBERHOME",
          oltRamal: `SLOT ${currentSlot} PON ${currentPon}`,
          onuNumber: onuData.onuNumber,
          onuModel: onuData.type,
          onuMac: onuData.mac,
          password: onuData.password,
          serial: onuData.serial,
          ponVlan: formatVlan(currentSlot, currentPon),
        });
      }
    }
  }

  return dataObjects;
}

function discoverNextOnuNumber(slot, pon) {
  const HOST = process.env.FIBERHOME_HOST;
  const PORT = 23;
  const USER = process.env.FIBERHOME_USERNAME;
  const PASS = `#${process.env.FIBERHOME_PASSWORD}`;
  const ENABLE_PASS = `#${process.env.FIBERHOME_PASSWORD}`;

  const client = new net.Socket();
  let step = 0;
  let buffer = "";
  let nextOnuNumber = null;

  return new Promise((resolve, reject) => {
    client.connect(PORT, HOST, () => {
      console.log("Connected to OLT via Telnet - Discovering next ONU number");
    });

    client.on("data", (data) => {
      buffer += data.toString("utf8");
      process.stdout.write(data.toString("utf8"));

      switch (step) {
        case 0: // Login
          if (/Login/i.test(buffer)) {
            client.write(USER + "\r\n");
            buffer = "";
            step++;
          }
          break;
        case 1: // Password
          if (/Password:/i.test(buffer)) {
            client.write(PASS + "\r\n");
            buffer = "";
            step++;
          }
          break;
        case 2: // User prompt
          if (/>\s*$/.test(buffer)) {
            client.write("enable\r\n");
            buffer = "";
            step++;
          }
          break;
        case 3: // Enable password
          if (/Password:/i.test(buffer)) {
            client.write(ENABLE_PASS + "\r\n");
            buffer = "";
            step++;
          }
          break;
        case 4: // Enable prompt
          if (/#\s*$/.test(buffer)) {
            client.write("cd gpononu\r\n");
            buffer = "";
            step++;
          }
          break;
        case 5: // Aguarda prompt após cd gpononu
          if (/#\s*$/.test(buffer)) {
            const command = `show authorization slot ${slot} link ${pon}\r\n`;
            client.write(command);
            buffer = "";
            step++;
          }
          break;
        case 6: // Processa a saída do comando
          if (/#\s*$/.test(buffer)) {
            // Extrai todos os números de ONU da saída
            const onuNumbers = [];
            const lines = buffer.split(/\r?\n/);

            lines.forEach((line) => {
              // Procura por linhas que contenham números de ONU (ex: "1   2   1")
              const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)/);
              if (match) {
                const lineSlot = parseInt(match[1]);
                const linePon = parseInt(match[2]);
                const lineOnu = parseInt(match[3]);

                if (lineSlot === parseInt(slot) && linePon === parseInt(pon)) {
                  onuNumbers.push(lineOnu);
                }
              }
            });

            // Encontra o próximo número disponível
            if (onuNumbers.length > 0) {
              const maxNumber = Math.max(...onuNumbers);
              nextOnuNumber = maxNumber + 1;
              console.log(`Próximo número de ONU disponível: ${nextOnuNumber}`);
            } else {
              // Se não houver ONUs, começa com 1
              nextOnuNumber = 1;
              console.log("Nenhuma ONU encontrada, começando com número 1");
            }

            client.end();
          }
          break;
      }
    });

    client.on("close", () => {
      console.log("Connection closed - Discovery complete");
      resolve(nextOnuNumber);
    });

    client.on("error", (err) => {
      console.error("Telnet client error:", err);
      reject(err);
    });
  });
}

function parseOmddm(response) {
  const lines = response.split("\n");

  for (const line of lines) {
    if (!line.trim().match(/^\d+\s+/)) continue;

    const cols = line.trim().split(/\s+/);

    return {
      rxPower: toFloat(cols[1]), // RxPower (ONU)
      txPower: toFloat(cols[3]), // TxPower
      biasCurrent: toFloat(cols[5]), // CurrTxBias
      temperature: toFloat(cols[7]), // Temperature
      voltage: toFloat(cols[9]), // Voltage
      txPowerOlt: toFloat(cols[11]), // PTxPower
      rxPowerOlt: toFloat(cols[12]), // PRxPower
    };
  }

  return {
    rxPower: null,
    txPower: null,
    biasCurrent: null,
    temperature: null,
    voltage: null,
    txPowerOlt: null,
    rxPowerOlt: null,
  };
}

function parseUnregisteredOnus(raw, meta) {
  const result = [];

  const lines = raw.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // ignora lixo
    if (!trimmed) continue;
    if (trimmed.startsWith("-")) continue;
    if (trimmed.startsWith("MAC")) continue;
    if (!trimmed.includes("Unauth")) continue;

    // divide por 2 ou mais espaços
    const columns = trimmed.split(/\s{2,}/);

    if (columns.length < 2) continue;

    result.push({
      onuMac: columns[0], // PRKS00da3a9c
      onuType: columns[columns.length - 1], // HG260
      slot: meta.slot,
      pon: meta.pon,
      oltIp: meta.oltIp,
      oltRamal: meta.oltRamal,
      oltName: meta.oltName,
      ponVlan: meta.ponVlan,
    });
  }

  return result;
}

function toFloat(value) {
  if (!value || value === "--") return null;
  return parseFloat(value.replace(",", "."));
}

class FiberHomeController {
  static async discoverOnus(_, res) {
    const HOST = process.env.FIBERHOME_HOST; // IP da OLT
    const PORT = 23; // Porta Telnet
    const USER = process.env.FIBERHOME_USERNAME;
    const PASS = `#${process.env.FIBERHOME_PASSWORD}`;
    const ENABLE_PASS = `#${process.env.FIBERHOME_PASSWORD}`;
    dotenv.config();
    try {
      const client = new net.Socket();

      let step = 0;
      let buffer = "";

      client.connect(PORT, HOST, () => {
        console.log("Connected to OLT via Telnet");
      });

      client.on("close", () => {
        console.log("Connection closed");
      });

      client.on("error", (err) => {
        console.error("Telnet client error:", err);
      });

      process.stdin.on("data", (data) => {
        client.write(data.toString());
      });

      client.on("data", (data) => {
        buffer += data.toString("utf8");
        process.stdout.write(data.toString("utf8"));

        switch (step) {
          case 0: // Aguarda Login:
            if (/Login/i.test(buffer)) {
              client.write(USER + "\r\n");
              buffer = "";
              step++;
            }
            break;
          case 1: // Aguarda Password:
            if (/Password:/i.test(buffer)) {
              client.write(PASS + "\r\n");
              buffer = "";
              step++;
            }
            break;
          case 2: // Aguarda User> prompt
            if (/>\s*$/.test(buffer)) {
              console.log("Login bem-sucedido. Entrando no enable...");
              client.write("enable\r\n");
              buffer = "";
              step++;
            }
            break;
          case 3: // Aguarda senha do enable
            if (/Password:/i.test(buffer)) {
              client.write(ENABLE_PASS + "\r\n");
              buffer = "";
              step++;
            }
            break;
          case 4: // Prompt # pronto
            if (/#\s*$/.test(buffer)) {
              console.log("Prompt # ativo. Executando comandos...");
              client.write("cd gpononu\r\n");
              buffer = "";
              step++;
            }
            break;
          case 5: // Aguarda prompt após cd
            if (/#\s*$/.test(buffer)) {
              client.write("show unauth_discovery\r\n");
              buffer = "";
              step++;
            }
            break;
          case 6: // Coletando dados do show command
            if (/#\s*$/.test(buffer)) {
              console.log("Comando finalizado. Processando dados...");
              res
                .status(200)
                .json({ onus: processDiscoveryData(buffer.toString()) });
              console.log(processDiscoveryData(buffer.toString()));
              client.end();
            }
            break;
        }
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erro ao descobrir ONUs", details: error.message });
    }
  }

  static async getRawUnregisteredOnusData(oltIp) {
    const olt = await oltModel.find({ oltIp });

    const slotAndPonList = olt.flatMap((olt) =>
      olt.interfaces.map((int) => ({
        slot: int.interface_gpon.slot,
        pon: int.interface_gpon.pon,
        oltIp: olt.oltIp,
        oltName: olt.oltName,
        oltRamal: int.nome,
        ponVlan: int.interface_gpon.vlan,
      })),
    );

    return new Promise((resolve) => {
      const USER = process.env.UNM_USERNAME;
      const PASS = process.env.UNM_PASSWORD;
      const PORT = 3337;
      const HOST = "192.168.21.9";

      const client = new net.Socket();

      let buffer = "";
      let ctag = Math.floor(Math.random() * 9000) + 1000;
      let loggedIn = false;
      let responded = false;

      let queue = [...slotAndPonList];
      let results = [];
      let current = null;

      const sendNextCommand = () => {
        if (queue.length === 0) {
          responded = true;
          client.end();
          return resolve({ onus: results });
        }

        current = queue.shift();
        buffer = "";

        const cmd = `LST-UNREGONU::OLTID=${current.oltIp},PONID=1-1-${current.slot}-${current.pon}:CTAG::;\r\n`;
        client.write(cmd);
      };

      client.setTimeout(6000, () => {
        if (!responded) {
          responded = true;
          client.destroy();
          return resolve({
            error: "Timeout ao consultar o UNM2000",
          });
        }
      });

      client.connect(PORT, HOST, () => {
        const loginCmd = `LOGIN:::${ctag}::UN=${USER},PWD=${PASS};\r\n`;
        client.write(loginCmd);
      });

      client.on("data", (data) => {
        buffer += data.toString();

        // LOGIN OK
        if (!loggedIn && buffer.includes("COMPLD")) {
          loggedIn = true;
          buffer = "";
          sendNextCommand();
          return;
        }

        // Resposta de comando TL1 completa
        if (
          loggedIn &&
          buffer.includes("COMPLD") &&
          buffer.trim().endsWith(";")
        ) {
          results.push({
            ...current,
            raw: buffer,
          });

          sendNextCommand();
        }
      });

      client.on("error", (err) => {
        if (!responded) {
          responded = true;
          client.destroy();
          return resolve({ error: `Erro TCP: ${err.message}` });
        }
      });

      client.on("close", () => {
        if (!responded) {
          responded = true;
          return resolve({
            error: "Conexão encerrada inesperadamente pelo UNM2000",
          });
        }
      });
    });
  }

  static async getUnregisteredOnus(req, res) {
    const oltIp = req.body.oltIp;
    const response = [];

    const data = await FiberHomeController.getRawUnregisteredOnusData(oltIp);
    if (data.error) return res.status(500).json(data);

    const blockRecordsRegex = /block_records\s*=\s*(\d+)/i;

    data.onus.forEach((item) => {
      if (!item.raw) return;

      const blockMatch = item.raw.match(blockRecordsRegex);
      const blockRecords = blockMatch ? parseInt(blockMatch[1], 10) : 0;

      if (blockRecords > 0) {
        const linhaOnuRegex =
          /^([A-Za-z0-9]+)\t.*?\t.*?\tUnauth\t[\d-]+\s[\d:]+\t([^\r\n]+)/gim;

        let match;

        while ((match = linhaOnuRegex.exec(item.raw)) !== null) {
          response.push({
            onuMac: match[1],
            onuType: match[2],
            slot: item.slot,
            pon: item.pon,
            oltIp: item.oltIp,
            oltRamal: item.oltRamal,
            oltName: item.oltName,
            ponVlan: item.ponVlan,
          });
        }
      }
    });

    return res.status(200).json(response);
  }

  static async getAllONUsFromUNM(_, res) {
    const olts = await oltModel.find({ vendor: "FIBERHOME" });

    if (!olts || olts.length === 0) {
      return res
        .status(404)
        .json({ error: "Nenhuma OLT FiberHome encontrada" });
    }

    return new Promise((resolve) => {
      const USER = process.env.UNM_USERNAME;
      const PASS = process.env.UNM_PASSWORD;
      const PORT = 3337;
      const HOST = "192.168.21.9";

      let buffer = "";
      let ctag = Math.floor(Math.random() * 9000) + 1000;
      let responded = false;
      let loggedIn = false;
      let oltIndex = 0;

      const allOnus = [];

      const client = new net.Socket();

      console.log("➡️ Iniciando consulta ao UNM2000...");

      client.setTimeout(8000, () => {
        if (!responded) {
          responded = true;
          client.destroy();
          return resolve(
            res.status(504).json({ error: "Timeout ao consultar o UNM2000" }),
          );
        }
      });

      const sendNextOlt = () => {
        if (oltIndex >= olts.length) {
          responded = true;
          client.end();
          return resolve(res.status(200).json({ onus: allOnus }));
        }

        const olt = olts[oltIndex];
        buffer = "";
        ctag++;

        console.log(`➡️ Consultando OLT ${olt.oltName} (${olt.oltIp})`);

        const cmd = `LST-ONU::OLTID=${olt.oltIp}:${ctag}::;\r\n`;
        client.write(cmd);
      };

      client.connect(PORT, HOST, () => {
        console.log(`🔌 Conectado em ${HOST}:${PORT}`);
        const loginCmd = `LOGIN:::${ctag}::UN=${USER},PWD=${PASS};\r\n`;
        client.write(loginCmd);
      });

      client.on("data", (data) => {
        buffer += data.toString();

        // LOGIN OK
        if (!loggedIn && buffer.includes("COMPLD")) {
          loggedIn = true;
          buffer = "";
          return sendNextOlt();
        }

        // resposta completa de um LST-ONU
        if (
          loggedIn &&
          buffer.includes("COMPLD") &&
          buffer.trim().endsWith(";")
        ) {
          console.log(`✅ OLT ${olts[oltIndex].oltName} processada`);

          const parsed = parseOnuListFromUnm(buffer, olts[oltIndex]);
          allOnus.push(...parsed);

          oltIndex++;
          buffer = "";
          return sendNextOlt();
        }
      });

      client.on("error", (err) => {
        if (!responded) {
          responded = true;
          client.destroy();
          return resolve(
            res.status(500).json({
              error: `Erro de conexão UNM2000: ${err.message}`,
            }),
          );
        }
      });

      client.on("close", () => {
        if (!responded) {
          responded = true;
          return resolve(
            res.status(500).json({
              error: "Conexão encerrada inesperadamente pelo UNM2000",
            }),
          );
        }
      });
    });
  }

  static async getOnusFromOltPon(req, res) {
    const { oltIp, slot, pon } = req.body;

    if (!oltIp || !slot || !pon) {
      return res.status(400).json({
        error: "oltIp, slot e pon são obrigatórios",
      });
    }

    return new Promise((resolve) => {
      const USER = process.env.UNM_USERNAME;
      const PASS = process.env.UNM_PASSWORD;
      const PORT = 3337;
      const HOST = "192.168.21.9";

      let buffer = "";
      let ctag = Math.floor(Math.random() * 9000) + 1000;
      let responded = false;
      let loggedIn = false;

      const client = new net.Socket();

      console.log(`➡️ Consultando OLT ${oltIp} | Slot ${slot} | PON ${pon}`);

      client.setTimeout(8000, () => {
        if (!responded) {
          responded = true;
          client.destroy();
          return resolve(
            res.status(504).json({
              error: "Timeout ao consultar o UNM2000",
            }),
          );
        }
      });

      client.connect(PORT, HOST, () => {
        console.log(`🔌 Conectado em ${HOST}:${PORT}`);
        const loginCmd = `LOGIN:::${ctag}::UN=${USER},PWD=${PASS};\r\n`;
        client.write(loginCmd);
      });

      client.on("data", (data) => {
        buffer += data.toString();

        // LOGIN OK
        if (!loggedIn && buffer.includes("COMPLD")) {
          loggedIn = true;
          buffer = "";
          ctag++;

          const cmd = `LST-ONU::OLTID=${oltIp},PONID=1-1-${slot}-${pon}:${ctag}::;\r\n`;
          return client.write(cmd);
        }

        // resposta completa do LST-ONU
        if (
          loggedIn &&
          buffer.includes("COMPLD") &&
          buffer.trim().endsWith(";")
        ) {
          responded = true;
          client.end();

          const onus = parseOnuListFromUnm(buffer, {
            oltIp,
            slot,
            pon,
          });

          return resolve(res.status(200).json({ onus }));
        }
      });

      client.on("error", (err) => {
        if (!responded) {
          responded = true;
          client.destroy();
          return resolve(
            res.status(500).json({
              error: `Erro de conexão UNM2000: ${err.message}`,
            }),
          );
        }
      });

      client.on("close", () => {
        if (!responded) {
          responded = true;
          return resolve(
            res.status(500).json({
              error: "Conexão encerrada inesperadamente pelo UNM2000",
            }),
          );
        }
      });
    });
  }

  static async deleteOnu(req, res) {
    const { slot, pon, mac, onuIdType = "MAC", alias, oltIp } = req.body;

    return new Promise((resolve, reject) => {
      const USER = process.env.UNM_USERNAME;
      const PASS = process.env.UNM_PASSWORD;
      const PORT = 3337;
      const HOST = "192.168.21.9";

      let buffer = "";
      let ctag = Math.floor(Math.random() * 9000) + 1000;
      let step = 0;

      const client = new net.Socket();

      client.connect(PORT, HOST, () => {
        const loginCmd = `LOGIN:::${ctag}::UN=${USER},PWD=${PASS};\r\n`;
        console.log("➡️ Enviando:", loginCmd.trim());
        client.write(loginCmd);
      });

      client.on("data", (data) => {
        buffer += data.toString();

        // 1️⃣ LOGIN
        if (step === 0 && buffer.includes("COMPLD")) {
          step = 1;
          buffer = "";
          ctag++;
          const delCmd = `DEL-ONU::OLTID=${oltIp},PONID=1-1-${slot}-${pon}:CTAG::ONUIDTYPE=${onuIdType},ONUID=${mac};\r\n`;
          console.log("➡️ Enviando:", delCmd.trim());
          client.write(delCmd);
          return;
        }

        // 2️⃣ DEL-ONU concluído
        if (
          step === 1 &&
          buffer.includes("COMPLD") &&
          buffer.trim().endsWith(";")
        ) {
          console.log("✅ ONU deletada com sucesso!");
          client.end();
          const auditoriaEntry = new Auditoria({
            user: req.user.name,
            status: "deletado",
            message: `cpe ${mac} deletada na olt FIBERHOME | interface ${slot}/${pon}.`,
            type: "cpe",
            client: alias,
            ipAddress: req.clientIP,
          });

          auditoriaEntry.save();
          return resolve(
            res.status(200).json({
              success: true,
              message: "ONU deletada com sucesso",
              response: buffer,
            }),
          );
        }

        // 3️⃣ Erro retornado pelo UNM
        if (buffer.includes("DENY") || buffer.includes("FAULT")) {
          console.error("⚠️ Erro ao deletar ONU:", buffer);
          client.end();
          return reject(
            res.status(400).json({
              success: false,
              error: "Falha ao deletar ONU",
              response: buffer,
            }),
          );
        }
      });

      client.on("error", (err) => {
        console.error("❌ Erro de conexão:", err.message);
        client.end();
        return reject(
          res.status(500).json({
            success: false,
            error: `Erro de conexão com UNM2000: ${err.message}`,
          }),
        );
      });

      client.on("close", () => {
        console.log("🔚 Conexão encerrada");
      });
    });
  }

  static async addAndConfigOnu(req, res) {
    const { slot, pon, mac, onuAlias, onuType, vlan, oltIp, useVeipService } =
      req.body;

    return new Promise((resolve, reject) => {
      const USER = process.env.UNM_USERNAME;
      const PASS = process.env.UNM_PASSWORD;
      const PORT = 3337;
      const HOST = "192.168.21.9";

      let buffer = "";
      let ctag = Math.floor(Math.random() * 9000) + 1000;
      let step = 0;

      const client = new net.Socket();

      client.connect(PORT, HOST, () => {
        const loginCmd = `LOGIN:::${ctag}::UN=${USER},PWD=${PASS};\r\n`;
        client.write(loginCmd);
      });

      client.on("data", (data) => {
        buffer += data.toString();

        console.log("⬅️ Resposta TL1:", buffer.trim());

        // 1️⃣ LOGIN
        if (step === 0 && buffer.includes("COMPLD")) {
          step = 1;
          buffer = "";
          ctag++;

          const addCmd =
            `ADD-ONU::OLTID=${oltIp},PONID=1-1-${slot}-${pon}:CTAG::` +
            `AUTHTYPE=MAC,ONUID=${mac},PWD=12345678,NAME=${onuAlias},DESC=NA,ONUTYPE=${onuType};\r\n`;

          console.log("➡️ Enviando:", addCmd.trim());

          client.write(addCmd);
          return;
        }

        // 2️⃣ ADD-ONU
        if (
          step === 1 &&
          buffer.includes("COMPLD") &&
          buffer.trim().endsWith(";")
        ) {
          step = 2;
          buffer = "";
          ctag++;

          // 🔀 muda VLANMODE conforme VEIP
          const vlanMode = useVeipService ? "Transparent" : "Tag";

          const cfgLanCmd =
            `CFG-LANPORT::OLTID=${oltIp},PONID=1-1-${slot}-${pon},` +
            `ONUIDTYPE=MAC,ONUID=${mac},ONUPORT=NA-NA-NA-1:CTAG::` +
            `VLANMOD=${vlanMode},PVID=${vlan},PCOS=0;\r\n`;

          console.log("➡️ Enviando:", cfgLanCmd.trim());

          client.write(cfgLanCmd);
          return;
        }

        // 3️⃣ CFG-LANPORT
        if (
          step === 2 &&
          buffer.includes("COMPLD") &&
          buffer.trim().endsWith(";")
        ) {
          buffer = "";
          ctag++;

          // 👉 se NÃO usar VEIP, finaliza aqui
          if (!useVeipService) {
            client.end();
            return finalizeSuccess();
          }

          // 👉 se usar VEIP, segue para CFG-VEIPSERVICE
          step = 3;

          const veipCmd =
            `CFG-VEIPSERVICE::OLTID=${oltIp},PONID=1-1-${slot}-${pon},` +
            `ONUIDTYPE=MAC,ONUID=${mac},ONUPORT=NA-NA-NA-1:CTAG::` +
            `ServiceId=1,CVLANID=${vlan},ServiceModelProfile=INTELBRAS_ROUTER,ServiceType=DATA;\r\n`;

          console.log("➡️ Enviando:", veipCmd.trim());

          client.write(veipCmd);
          return;
        }

        // 4️⃣ CFG-VEIPSERVICE
        if (
          step === 3 &&
          buffer.includes("COMPLD") &&
          buffer.trim().endsWith(";")
        ) {
          client.end();
          return finalizeSuccess();
        }
      });

      client.on("error", (err) => {
        client.end();
        reject(
          res.status(500).json({
            error: `erro ao conectar no UNM: ${err.message}`,
          }),
        );
      });

      const finalizeSuccess = () => {
        const auditoriaEntry = new Auditoria({
          user: req.user.name,
          status: "cadastrado",
          message: `cpe ${mac} provisionada na olt FIBERHOME | interface ${slot}/${pon}.`,
          type: "cpe",
          client: onuAlias,
          ipAddress: req.clientIP,
        });

        auditoriaEntry.save();
        resolve(res.status(200).json({ success: true }));
      };
    });
  }

  static async getOnuSignalLevels(onuList) {
    const HOST = process.env.FIBERHOME_HOST;
    const PORT = 23;
    const USER = process.env.FIBERHOME_USERNAME;
    const PASS = `#${process.env.FIBERHOME_PASSWORD}`;
    const ENABLE_PASS = `#${process.env.FIBERHOME_PASSWORD}`;

    const client = new net.Socket();
    let step = 0;
    let buffer = "";
    let currentOnuIndex = 0;
    let results = [];

    return new Promise((resolve, reject) => {
      client.connect(PORT, HOST, () => {
        console.log("Connected to OLT via Telnet - Getting ONU signal levels");
      });

      client.on("data", (data) => {
        buffer += data.toString("utf8");
        process.stdout.write(data.toString("utf8"));

        switch (step) {
          case 0: // Login
            if (/Login/i.test(buffer)) {
              client.write(USER + "\r\n");
              buffer = "";
              step++;
            }
            break;
          case 1: // Password
            if (/Password:/i.test(buffer)) {
              client.write(PASS + "\r\n");
              buffer = "";
              step++;
            }
            break;
          case 2: // User prompt
            if (/>\s*$/.test(buffer)) {
              client.write("enable\r\n");
              buffer = "";
              step++;
            }
            break;
          case 3: // Enable password
            if (/Password:/i.test(buffer)) {
              client.write(ENABLE_PASS + "\r\n");
              buffer = "";
              step++;
            }
            break;
          case 4: // Enable prompt
            if (/#\s*$/.test(buffer)) {
              client.write("cd gpononu\r\n");
              buffer = "";
              step++;
            }
            break;
          case 5: // Aguarda prompt após cd gpononu
            if (/#\s*$/.test(buffer)) {
              // Inicia o processo com a primeira ONU
              if (currentOnuIndex < onuList.length) {
                const onu = onuList[currentOnuIndex];
                const command = `show optic_module slot ${onu.slot} link ${onu.pon} onu ${onu.onuNumber}\r\n`;
                client.write(command);
                buffer = "";
                step++;
              } else {
                // Todas as ONUs foram processadas
                client.end();
              }
            }
            break;
          case 6: // Processa a saída do comando show optic_module
            if (/#\s*$/.test(buffer)) {
              const onu = onuList[currentOnuIndex];
              const signalData = this.parseOpticModuleOutput(buffer, onu);

              results.push(signalData);

              // Prepara para próxima ONU
              currentOnuIndex++;
              buffer = "";

              if (currentOnuIndex < onuList.length) {
                // Próxima ONU
                const nextOnu = onuList[currentOnuIndex];
                const command = `show optic_module slot ${nextOnu.slot} link ${nextOnu.pon} onu ${nextOnu.onuNumber}\r\n`;
                client.write(command);
              } else {
                // Todas as ONUs processadas, volta para diretório anterior
                client.write("cd ..\r\n");
                step++;
              }
            }
            break;
          case 7: // Volta para root e finaliza
            if (/#\s*$/.test(buffer)) {
              console.log("Todas as ONUs processadas com sucesso!");
              client.end();
            }
            break;
        }
      });

      client.on("close", () => {
        console.log("Connection closed - Signal levels retrieval complete");
        resolve(results);
      });

      client.on("error", (err) => {
        console.error("Telnet client error:", err);
        reject(err);
      });
    });
  }

  static async getOnuOpticalPower(req, res) {
    const { onus } = req.body;

    if (!Array.isArray(onus) || onus.length === 0) {
      return res.status(400).json({ error: "Array de ONUs inválido" });
    }

    const USER = process.env.UNM_USERNAME;
    const PASS = process.env.UNM_PASSWORD;
    const HOST = "192.168.21.9";
    const PORT = 3337;

    let buffer = "";
    let ctag = Math.floor(Math.random() * 9000) + 1000;
    let step = -1;

    const results = [];

    const commands = onus.map((onu) => ({
      onu,
      cmd: `LST-OMDDM::OLTID=${onu.oltIp},PONID=1-1-${onu.slot}-${onu.pon},ONUIDTYPE=ONU_NUMBER,ONUID=${onu.onuNumber},PEERFLAG=True`,
    }));

    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
      client.write(`LOGIN:::${ctag}::UN=${USER},PWD=${PASS};\r\n`);
    });

    client.on("data", (data) => {
      buffer += data.toString();

      if (!buffer.includes("COMPLD") || !buffer.trim().endsWith(";")) return;

      const response = buffer;
      buffer = "";

      if (step === -1) {
        step = 0;
      } else {
        const { onu } = commands[step - 1];
        const optical = parseOmddm(response);

        results.push({
          name: onu.name,
          mac: onu.mac,
          slot: onu.slot,
          pon: onu.pon,
          onuNumber: onu.onuNumber,
          RSSI:
            optical.rxPowerOlt !== null
              ? `${optical.rxPowerOlt}dBm (+-3dBm)`
              : null,
          ["Power Level"]:
            optical.rxPower !== null ? `${optical.rxPower}dBm (+-3dBm)` : null,
          temperature: optical.temperature,
          voltage: optical.voltage,
          biasCurrent: optical.biasCurrent,
          timestamp: new Date().toISOString(),
        });
      }

      if (step < commands.length) {
        const { cmd } = commands[step];
        ctag++;
        client.write(`${cmd}:${ctag}::;\r\n`);
        console.log(`➡️  ${cmd}`);
        step++;
        return;
      }

      client.end();
      return res.status(200).json(results);
    });

    client.on("error", (err) => {
      client.end();
      return res.status(500).json({ error: err.message });
    });
  }

  static parseOpticModuleOutput(buffer, onu) {
    const lines = buffer.split(/\r?\n/);
    let rxPower = null;
    let txPower = null;
    let temperature = null;
    let voltage = null;
    let biasCurrent = null;

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // RECV POWER (RX)
      if (
        trimmedLine.includes("RECV POWER") &&
        !trimmedLine.includes("OLT RECV POWER")
      ) {
        const match = trimmedLine.match(
          /RECV POWER\s+:\s+([-\d.]+)\s+\(Dbm\)/i,
        );
        if (match) {
          txPower = parseFloat(match[1]);
          console.log(`RX Power encontrado: ${rxPower} dBm`);
        }
      }

      // OLT RECV POWER (RX da perspectiva da OLT) - usado como fallback
      if (trimmedLine.includes("OLT RECV POWER")) {
        const match = trimmedLine.match(
          /OLT RECV POWER\s+:\s+([-\d.]+)\s+\(Dbm\)/i,
        );
        if (match) {
          rxPower = parseFloat(match[1]);
          console.log(`OLT RX Power encontrado: ${rxPower} dBm`);
        }
      }

      // Outros parâmetros opcionais
      if (line.includes("TEMPERATURE")) {
        const match = line.match(/TEMPERATURE\s+:\s+([-\d.]+)\s+\('C\)/);
        if (match) temperature = parseFloat(match[1]);
      }

      if (line.includes("VOLTAGE")) {
        const match = line.match(/VOLTAGE\s+:\s+([-\d.]+)\s+\(V\)/);
        if (match) voltage = parseFloat(match[1]);
      }

      if (line.includes("BIAS CURRENT")) {
        const match = line.match(/BIAS CURRENT\s+:\s+([-\d.]+)\s+\(mA\)/);
        if (match) biasCurrent = parseFloat(match[1]);
      }
    });

    if (rxPower === null) {
      return {
        name: onu.name,
        mac: onu.mac,
        slot: onu.slot,
        pon: onu.pon,
        onuNumber: onu.onuNumber,
        RSSI: "NO SIGNAL",
        ["Power Level"]: "NO SIGNAL",
        temperature: "N/A",
        voltage: "N/A",
        biasCurrent: "N/A",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      name: onu.name,
      mac: onu.mac,
      slot: onu.slot,
      pon: onu.pon,
      onuNumber: onu.onuNumber,
      RSSI: `${rxPower}dBm (+-3dBm)`,
      ["Power Level"]: `${txPower}dBm (+-3dBm)`,
      temperature: temperature,
      voltage: voltage,
      biasCurrent: biasCurrent,
      timestamp: new Date().toISOString(),
    };
  }

  static async getOnuSignals(req, res) {
    try {
      const onuList = req.body; // Array de ONUs do formato especificado

      if (!Array.isArray(onuList) || onuList.length === 0) {
        return res
          .status(400)
          .json({ error: "Lista de ONUs inválida ou vazia" });
      }

      const signalLevels =
        await FiberHomeController.getOnuSignalLevels(onuList);

      return res.status(200).json(signalLevels);
    } catch (error) {
      console.error("Erro ao obter níveis de sinal:", error);
      return res.status(500).json({
        error: "Erro ao obter níveis de sinal",
        details: error.message,
      });
    }
  }

  static async executeTl1Script(req, res) {
    const { script, slot, pon } = req.body;

    if (!script || typeof script !== "string") {
      return res.status(400).json({ error: "Script TL1 inválido" });
    }

    const USER = process.env.UNM_USERNAME;
    const PASS = process.env.UNM_PASSWORD;
    const PORT = 3337;
    const HOST = "192.168.21.9";

    const commands = script
      .split(";")
      .map((cmd) => cmd.trim())
      .filter(Boolean);

    if (commands.length === 0) {
      return res.status(400).json({ error: "Nenhum comando TL1 encontrado" });
    }

    let buffer = "";
    let ctag = Math.floor(Math.random() * 9000) + 1000;
    let step = -1;

    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
      console.log("Conectado ao UNM2000");
      const loginCmd = `LOGIN:::${ctag}::UN=${USER},PWD=${PASS};\r\n`;
      client.write(loginCmd);
    });

    client.on("data", (data) => {
      buffer += data.toString();

      if (!buffer.includes("COMPLD") || !buffer.trim().endsWith(";")) {
        return;
      }

      const response = buffer;
      buffer = "";

      console.log("⬅️ Resposta TL1:", response.trim());

      if (step === -1) {
        step = 0;
      } else {
        step++;
      }

      if (step < commands.length) {
        ctag++;
        const cmd = `${commands[step]};\r\n`;
        console.log("➡️ Enviando:", cmd.trim());
        client.write(cmd);
        return;
      }

      client.end();
      return res.status(200).json({
        success: true,
        message: "Script TL1 executado com sucesso",
      });
    });

    client.on("error", (err) => {
      console.error("Erro de conexão TL1:", err.message);
      client.end();
      return res.status(500).json({
        error: `Erro ao conectar no UNM: ${err.message}`,
      });
    });

    client.on("close", () => {
      console.log("Conexão TL1 encerrada");
    });
  }
}

export default FiberHomeController;
