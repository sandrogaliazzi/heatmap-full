import net from "net";
import dotenv from "dotenv";
import { setTimeout } from "timers/promises";
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detecta linha com SLOT e PON
    if (line.includes("SLOT=") && line.includes("PON=")) {
      const slotMatch = line.match(/SLOT=(\d+)/);
      const ponMatch = line.match(/PON=(\d+)/);

      if (slotMatch) currentSlot = slotMatch[1];
      if (ponMatch) currentPon = ponMatch[1];
    }

    // Detecta linha com dados da ONU (linha que começa com número)
    if (/^\d{2}\s+/.test(line) && currentSlot && currentPon) {
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

    // Timeout de 30 segundos
    setTimeout(30000).then(() => {
      console.error("Timeout na descoberta do número da ONU");
      client.end();
      resolve(null);
    });
  });
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
      let dataObjects = [];

      client.connect(PORT, HOST, () => {
        console.log("Connected to OLT via Telnet");
      });

      client.on("close", () => {
        console.log("Connection closed");
        console.log("Total de ONUs descobertas:", dataObjects.length);
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
              res.status(200).json({ onus: processDiscoveryData(buffer) });
              console.log(
                "ONUs descobertas:",
                JSON.stringify(dataObjects, null, 2)
              );
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

  static getAllONUsFromUNM(_, res) {
    return new Promise((resolve, reject) => {
      const USER = process.env.UNM_USERNAME;
      const PASS = process.env.UNM_PASSWORD;
      const PORT = 3337;
      const HOST = "192.168.21.9";
      let buffer = "";
      let ctag = Math.floor(Math.random() * 9000) + 1000; // Gera um CTAG aleatório entre 1000-9999

      const client = new net.Socket();

      client.connect(PORT, HOST, () => {
        console.log("Conectado ao UNM2000");

        const loginCmd = `LOGIN:::${ctag}::UN=${USER},PWD=${PASS};\r\n`;
        client.write(loginCmd);
      });

      let loggedIn = false;

      // Recebe resposta do servidor
      client.on("data", (data) => {
        buffer += data.toString();

        if (!loggedIn && buffer.includes("COMPLD")) {
          loggedIn = true;
          buffer = "";
          // Agora envia comando de consulta ONUs
          const lstCmd = `LST-ONU::OLTID=192.168.200.2:CTAG::;\r\n`;
          console.log("➡️ Enviando:", lstCmd.trim());
          client.write(lstCmd);
        }

        if (
          loggedIn &&
          buffer.includes("COMPLD") &&
          buffer.trim().endsWith(";")
        ) {
          client.end();
          resolve(res.status(200).json({ onus: parseOnuListFromUnm(buffer) }));
        }
      });

      client.on("error", (err) => {
        console.error("Erro de conexão:", err.message);
        reject(
          res
            .status(500)
            .json({ error: `erro ao conectar no unm: ${err.message}` })
        );
        client.end();
      });
    });
  }

  static async deleteOnu(req, res) {
    const { slot, pon, mac, onuIdType = "MAC" } = req.body;

    return new Promise((resolve, reject) => {
      const USER = process.env.UNM_USERNAME;
      const PASS = process.env.UNM_PASSWORD;
      const PORT = 3337;
      const HOST = "192.168.21.9";
      const OLTID = "192.168.200.2";

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
          const delCmd = `DEL-ONU::OLTID=${OLTID},PONID=1-1-${slot}-${pon}:CTAG::ONUIDTYPE=${onuIdType},ONUID=${mac};\r\n`;
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
          return resolve(
            res.status(200).json({
              success: true,
              message: "ONU deletada com sucesso",
              response: buffer,
            })
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
            })
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
          })
        );
      });

      client.on("close", () => {
        console.log("🔚 Conexão encerrada");
      });
    });
  }

  static async addAndConfigOnu(req, res) {
    const { slot, pon, mac, onuAlias, onuType, vlan } = req.body;
    let onuNumber;
    try {
      onuNumber = await discoverNextOnuNumber(slot, pon);
    } catch (error) {
      console.error("Erro ao descobrir n mero de ONU:", error.message);
      return res.status(500).json({ error: "Erro ao descobrir n mero de ONU" });
    }

    return new Promise((resolve, reject) => {
      const USER = process.env.UNM_USERNAME;
      const PASS = process.env.UNM_PASSWORD;
      const PORT = 3337;
      const HOST = "192.168.21.9";
      let buffer = "";
      let ctag = Math.floor(Math.random() * 9000) + 1000;

      const client = new net.Socket();
      let step = 0;

      client.connect(PORT, HOST, () => {
        console.log("Conectado ao UNM2000");
        const loginCmd = `LOGIN:::${ctag}::UN=${USER},PWD=${PASS};\r\n`;
        client.write(loginCmd);
      });

      client.on("data", (data) => {
        buffer += data.toString();

        // 1. LOGIN
        if (step === 0 && buffer.includes("COMPLD")) {
          step = 1;
          buffer = "";
          ctag++;
          const addCmd = `ADD-ONU::OLTID=192.168.200.2,PONID=1-1-${slot}-${pon}:CTAG::AUTHTYPE=MAC,ONUID=${mac},PWD=12345678,ONUNO=${onuNumber},NAME=${onuAlias},DESC=NA,ONUTYPE=${onuType};\r\n`;
          console.log("➡️ Enviando:", addCmd.trim());
          client.write(addCmd);
          return;
        }

        // 2. ADD-ONU
        if (
          step === 1 &&
          buffer.includes("COMPLD") &&
          buffer.trim().endsWith(";")
        ) {
          step = 2;
          buffer = "";
          ctag++;
          const cfgCmd = `CFG-LANPORT::OLTID=192.168.200.2,PONID=1-1-${slot}-${pon},ONUIDTYPE=MAC,ONUID=${mac},ONUPORT=NA-NA-NA-1:CTAG::VLANMOD=Tag,PVID=${vlan},PCOS=0;\r\n`;
          console.log("➡️ Enviando:", cfgCmd.trim());
          client.write(cfgCmd);
          return;
        }

        // 3. CFG-LANPORT
        if (
          step === 2 &&
          buffer.includes("COMPLD") &&
          buffer.trim().endsWith(";")
        ) {
          client.end();
          resolve(res.status(200).json({ success: true, message: buffer }));
        }
      });

      client.on("error", (err) => {
        console.error("Erro de conexão:", err.message);
        reject(
          res
            .status(500)
            .json({ error: `erro ao conectar no unm: ${err.message}` })
        );
        client.end();
      });
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

      // Timeout de 60 segundos (pode precisar de mais tempo para muitas ONUs)
      setTimeout(60000).then(() => {
        console.error("Timeout na obtenção dos níveis de sinal");
        client.end();
        resolve(results); // Retorna o que conseguiu até agora
      });
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
          /RECV POWER\s+:\s+([-\d.]+)\s+\(Dbm\)/i
        );
        if (match) {
          txPower = parseFloat(match[1]);
          console.log(`RX Power encontrado: ${rxPower} dBm`);
        }
      }

      // OLT RECV POWER (RX da perspectiva da OLT) - usado como fallback
      if (trimmedLine.includes("OLT RECV POWER")) {
        const match = trimmedLine.match(
          /OLT RECV POWER\s+:\s+([-\d.]+)\s+\(Dbm\)/i
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

      const signalLevels = await FiberHomeController.getOnuSignalLevels(
        onuList
      );

      return res.status(200).json(signalLevels);
    } catch (error) {
      console.error("Erro ao obter níveis de sinal:", error);
      return res.status(500).json({
        error: "Erro ao obter níveis de sinal",
        details: error.message,
      });
    }
  }
}

export default FiberHomeController;
