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
          pon: currentPon,
          onuNumber: onuData.onuNumber,
          type: onuData.type,
          mac: onuData.mac,
          password: onuData.password,
          serial: onuData.serial,
        });
      }
    }
  }

  return dataObjects;
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

      client.on("data", (data) => {
        buffer += data.toString("utf8");
        process.stdout.write(data.toString("utf8"));

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

  static async authorizeAndProvisionOnu(req, res) {
    const HOST = process.env.FIBERHOME_HOST; // IP da OLT
    const PORT = 23; // Porta Telnet
    const USER = process.env.FIBERHOME_USERNAME;
    const PASS = `#${process.env.FIBERHOME_PASSWORD}`;
    const ENABLE_PASS = `#${process.env.FIBERHOME_PASSWORD}`;
    dotenv.config();
    const { slot, pon, onuNumber, mac, vlan } = req.body;

    const client = new net.Socket();
    let step = 0;
    let buffer = "";
    let authorized = false;
    let provisioned = false;

    return new Promise((resolve, reject) => {
      client.connect(PORT, HOST, () => {
        console.log("Connected to OLT via Telnet");
      });

      client.on("data", async (data) => {
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
          case 4: // Enable prompt - Autorizar ONU
            if (/#\s*$/.test(buffer)) {
              console.log(
                `Autorizando ONU ${mac} no slot ${slot}/pon ${pon}...`
              );

              // Comando para adicionar à whitelist
              client.write("cd gpononu\r\n");
              buffer = "";
              step++;
            }
            break;
          case 5: // Aguarda prompt após cd gpononu
            if (/#\s*$/.test(buffer)) {
              const authCommand = `set whitelist phy_addr address ${mac} password null action add slot null link null onu null type null\r\n`;
              client.write(authCommand);
              buffer = "";
              step++;
            }
            break;
          case 6: // Aguarda confirmação da autorização
            if (/#\s*$/.test(buffer)) {
              authorized = true;
              console.log("ONU autorizada com sucesso!");

              // Iniciar provisionamento
              client.write("cd ..\r\n");
              buffer = "";
              step++;
            }
            break;
          case 7: // Volta para root e entra no epononu
            if (/#\s*$/.test(buffer)) {
              client.write("cd epononu\r\n");
              buffer = "";
              step++;
            }
            break;
          case 8: // Entra no qinq
            if (/#\s*$/.test(buffer)) {
              client.write("cd qinq\r\n");
              buffer = "";
              step++;
            }
            break;
          case 9: // Comandos de provisionamento
            if (/#\s*$/.test(buffer)) {
              console.log("Iniciando provisionamento...");

              // Comandos sequenciais de provisionamento
              const commands = [
                `set epon slot ${slot} pon ${pon} onu ${onuNumber} port 1 service number 1\r\n`,
                `set epon slot ${slot} pon ${pon} onu ${onuNumber} port 1 service 1 type unicast\r\n`,
                `set epon slot ${slot} pon ${pon} onu ${onuNumber} port 1 service 1 tls disable\r\n`,
                `set epon slot ${slot} pon ${pon} onu ${onuNumber} port 1 service 1 translate disable\r\n`,
                `set epon slot ${slot} pon ${pon} onu ${onuNumber} port 1 service 1 vlan_mode tag 0 33024 ${vlan}\r\n`,
                `apply onu ${slot} ${pon} ${onuNumber} vlan\r\n`,
              ];

              // Envia comandos sequencialmente
              for (const command of commands) {
                client.write(command);
                await setTimeout(500); // Pequena pausa entre comandos
              }

              buffer = "";
              step++;
            }
            resolve(
              res.status(200).json({ message: "ONU provisionada com sucesso" })
            );
            break;
        }
      });

      client.on("close", () => {
        console.log("Connection closed");
        resolve(authorized && provisioned);
      });

      client.on("error", (err) => {
        console.error("Telnet client error:", err);
        reject(
          res
            .status(500)
            .json({ error: "Erro na conexão Telnet", details: err.message })
        );
      });

      // Timeout de 30 segundos
      setTimeout(30000).then(() => {
        if (!authorized || !provisioned) {
          console.error("Timeout na operação");
          client.end();
          resolve(res.status(500).json({ error: "Timeout na operação" }));
        }
      });
    });
  }
}

export default FiberHomeController;
