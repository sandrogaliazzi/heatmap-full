import ramaisModel from "../models/ramaisOlt.js";
import { Client } from "ssh2";
import dotenv from "dotenv";
import OnuClient from "../models/onuClient.js";
dotenv.config();

class oltController {
  static ListarRamais = (req, res) => {
    ramaisModel
      .find((err, ramal) => {
        res.status(200).json(ramal);
      })
      .sort({ _id: -1 });
  };

  static saveRamal = (req, res) => {
    try {
      const ramal = new ramaisModel({ ...req.body });

      ramal.save((err) => {
        if (err) {
          res
            .status(500)
            .send({ message: `${err.message} - falha ao cadastrar ramal` });
        } else {
          res.status(200).send({ message: `ramal cadastrada com sucesso.` });
        }
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  static verificarRamais = (req, res) => {
    let searchString = req.body.Ramal;

    let regex = new RegExp(searchString, "i"); // "i" for case-insensitive search

    ramaisModel.find({ ID: { $regex: regex } }, (err, ramal) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: `Back-end err: ${err}` });
      } else {
        if (ramal.length === 0) {
          res.status(200).json({ message: "No Ramal found" });
        } else {
          res.status(200).json(ramal);
        }
      }
    });
  };

  static VerificarOnuAConfigurarPon = (req, res) => {
    let host = req.body.oltIp;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Error connecting to the OLT" });
            return;
          }

          let dataBuffer = "";
          let onus = [];

          stream
            .on("close", () => {
              res.json(onus);
              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();
              if (dataBuffer.includes("\n")) {
                const lines = dataBuffer.split("\n");
                dataBuffer = lines.pop();
                for (const line of lines) {
                  if (line.includes("|") && !line.includes("Interface")) {
                    const values = line.split("|").map((value) => value.trim());
                    const [gpon, onuMac, onuModel] = values;

                    onus.push({
                      onuMac,
                      gpon,
                      onuModel,
                    });
                  }
                }
              }
            });
          stream.write("show gpon onu unconfigured\n");
          stream.write("exit\n");
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Error connecting to the OLT" });
      })
      .connect({
        host: host,
        port: 22,
        username: username,
        password: password,
      });
  };

  static VerificarPerfisGpon = (req, res) => {
    const host = req.body.oltIp;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Erro ao conectar na OLT" });
            return;
          }

          let dataBuffer = "";
          let perfis = [];
          let currentPerfil = null;

          stream
            .on("close", () => {
              // Processa qualquer dado restante no buffer
              if (dataBuffer.trim()) {
                processDataBuffer(dataBuffer);
              }
              // Adiciona o último perfil se existir
              if (currentPerfil) {
                perfis.push(currentPerfil);
              }

              res.status(200).json(perfis);
              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();

              processDataBuffer(dataBuffer);
              dataBuffer = "";
            });

          const processDataBuffer = (buffer) => {
            const lines = buffer.split("\n");

            for (const line of lines) {
              const trimmed = line.trim();

              // Ignora linhas de cabeçalho e comandos
              if (
                !trimmed ||
                trimmed.startsWith("Index") ||
                trimmed.startsWith("----") ||
                trimmed.includes("show") ||
                trimmed.includes("exit") ||
                trimmed.includes("terminal length")
              ) {
                continue;
              }

              // Detecta início de um novo perfil (linha sem "|" e que não é numérica)
              if (
                trimmed &&
                !trimmed.includes("|") &&
                !/^\d+$/.test(trimmed) &&
                trimmed !== "-"
              ) {
                // Salva o perfil anterior se existir
                if (currentPerfil && currentPerfil.entries.length > 0) {
                  perfis.push(currentPerfil);
                }

                currentPerfil = {
                  name: trimmed,
                  entries: [],
                };
                continue;
              }

              // Processa linhas de dados da tabela
              if (trimmed.includes("|") && currentPerfil) {
                const values = trimmed
                  .split("|")
                  .map((v) => v.trim())
                  .filter((v) => v !== "");

                // Valida se é uma linha de dados válida (tem pelo menos 8 campos e o primeiro é número)
                if (values.length >= 8 && !isNaN(parseInt(values[0]))) {
                  // Para linhas com 8 campos (sem PBMP Ports), adiciona um campo vazio
                  const normalizedValues =
                    values.length === 8 ? [...values, ""] : values;

                  const [
                    index,
                    type,
                    vlan,
                    cos,
                    encryption,
                    downstream,
                    bandwidthName,
                    shared,
                    pbmpPorts,
                  ] = normalizedValues;

                  currentPerfil.entries.push({
                    index: parseInt(index),
                    type,
                    vlan: vlan !== "-" ? parseInt(vlan) : vlan,
                    cos: cos !== "-" ? cos : null,
                    encryption,
                    downstream: parseInt(downstream),
                    bandwidthName,
                    shared: shared === "Yes",
                    pbmpPorts: pbmpPorts || "", // Garante que não seja undefined
                  });
                }
              }
            }
          };

          stream.write("terminal length 0\n");
          stream.write("sh gpon profile flow\n");
          // Aguarda um tempo para o comando executar antes de sair
          new Promise((resolve) => setTimeout(resolve, 300)).then(() =>
            stream.write("exit\n")
          );
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Erro ao conectar à OLT" });
      })
      .connect({
        host,
        port: 22,
        username,
        password,
      });
  };

  static VerificarVlanTranslation = (req, res) => {
    const host = req.body.oltIp;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Erro ao conectar na OLT" });
            return;
          }

          let dataBuffer = "";
          let translations = [];
          let currentTranslation = null;

          stream
            .on("close", () => {
              // Processa qualquer dado restante no buffer
              if (dataBuffer.trim()) {
                processDataBuffer(dataBuffer);
              }
              // Adiciona a última tradução se existir
              if (currentTranslation) {
                translations.push(currentTranslation);
              }

              res.status(200).json(translations);
              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();

              processDataBuffer(dataBuffer);
              dataBuffer = "";
            });

          const processDataBuffer = (buffer) => {
            const lines = buffer.split("\n");

            for (const line of lines) {
              const trimmed = line.trim();

              // Ignora linhas de cabeçalho e comandos
              if (
                !trimmed ||
                trimmed.startsWith("Index") ||
                trimmed.startsWith("----") ||
                trimmed.includes("show") ||
                trimmed.includes("exit") ||
                trimmed.includes("terminal length")
              ) {
                continue;
              }

              // Detecta início de um novo perfil de VLAN translation (começa com _)
              if (trimmed && trimmed.startsWith("_") && trimmed.includes(":")) {
                // Salva a tradução anterior se existir
                if (
                  currentTranslation &&
                  currentTranslation.entries.length > 0
                ) {
                  translations.push(currentTranslation);
                }

                // Extrai o nome do perfil (remove o : no final)
                const profileName = trimmed.replace(":", "").trim();

                currentTranslation = {
                  name: profileName,
                  entries: [],
                };
                continue;
              }

              // Processa linhas de dados da tabela
              if (trimmed.includes("|") && currentTranslation) {
                const values = trimmed
                  .split("|")
                  .map((v) => v.trim())
                  .filter((v) => v !== "");

                // Valida se é uma linha de dados válida (tem pelo menos 6 campos e o primeiro é número)
                if (values.length >= 6 && !isNaN(parseInt(values[0]))) {
                  const [
                    index,
                    mode,
                    vlanX,
                    vlanC,
                    filterPrio,
                    vlanPrio,
                    // O último campo pode ser "F->X-F" ou similar
                  ] = values;

                  // Pega o último campo que pode ser a direção da tradução
                  const direction = values[6] || "";

                  currentTranslation.entries.push({
                    index: parseInt(index),
                    mode,
                    vlanX: vlanX !== "-" ? parseInt(vlanX) : vlanX,
                    vlanC: vlanC !== "-" ? parseInt(vlanC) : vlanC,
                    filterPrio: filterPrio !== "-" ? filterPrio : null,
                    vlanPrio: vlanPrio !== "-" ? parseInt(vlanPrio) : vlanPrio,
                    direction: direction,
                  });
                }
              }
            }
          };

          stream.write("terminal length 0\n");
          stream.write("sh gpon profile vlan-translation\n");
          // Aguarda um tempo para o comando executar antes de sair
          new Promise((resolve) => setTimeout(resolve, 300)).then(() =>
            stream.write("exit\n")
          );
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Erro ao conectar à OLT" });
      })
      .connect({
        host,
        port: 22,
        username,
        password,
      });
  };

  static VerificarOnu = (req, res) => {
    let host = req.body.oltIp;
    let onuAlias = req.body.onuAlias;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Error connecting to the OLT" });
            return;
          }

          let dataBuffer = "";
          let onus = [];
          let jsonOutput = {};

          stream
            .on("close", () => {
              res.json(jsonOutput); // Send jsonOutput as the response
              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();
              if (dataBuffer.includes("\n")) {
                const lines = dataBuffer.split("\n");
                dataBuffer = lines.pop();
                for (const line of lines) {
                  if (line.startsWith("%")) {
                    // Skip lines starting with %
                    continue;
                  }

                  if (line.includes(":")) {
                    const [key, value] = line.split(":");
                    const trimmedKey = key.trim();
                    const trimmedValue = value.trim();

                    if (trimmedKey === "Status") {
                      jsonOutput[onuAlias] = { Status: trimmedValue };
                    } else if (
                      trimmedKey === "Power Level" ||
                      trimmedKey === "RSSI"
                    ) {
                      if (jsonOutput[onuAlias]) {
                        jsonOutput[onuAlias][trimmedKey] = trimmedValue;
                      }
                    }
                  }
                }
              }
            });

          stream.write(`show gpon onu ${onuAlias} status\n`);
          stream.write("exit\n");
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Error connecting to the OLT" });
      })
      .connect({
        host: host,
        port: 22,
        username: username,
        password: password,
      });
  };

  static VerificarOnuSummary = (req, res) => {
    let host = req.body.oltIp;
    let onuAlias = req.body.onuAlias;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Error connecting to the OLT" });
            return;
          }

          let dataBuffer = "";
          let jsonOutput = {}; // Updated to store the entire object

          stream
            .on("close", () => {
              res.json(jsonOutput); // Send jsonOutput as the response

              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();
              if (dataBuffer.includes("\n")) {
                const lines = dataBuffer.split("\n");
                dataBuffer = lines.pop();
                for (const line of lines) {
                  if (line.includes(":")) {
                    const [key, ...values] = line.split(":");
                    const trimmedKey = key.trim();
                    const trimmedValue = values.join(":").trim();

                    jsonOutput[trimmedKey] = trimmedValue;
                  }
                }
              }
            });

          stream.write(`show gpon onu ${onuAlias} summary\n`);
          stream.write("exit\n");
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Error connecting to the OLT" });
      })
      .connect({
        host: host,
        port: 22,
        username: username,
        password: password,
      });
  };

  static VerificarSinalPon = (req, res) => {
    let host = req.body.oltIp;
    let gpon = req.body.oltPon;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    let responseSent = false;

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            if (!responseSent) {
              console.error(err);
              res.status(500).json({ error: "Error connecting to the OLT" });
              responseSent = true;
            }
            return;
          }

          let dataBuffer = "";
          let jsonOutput = null;

          stream
            .on("close", () => {
              if (!responseSent) {
                res.json(jsonOutput); // Enviar a resposta apenas uma vez
                responseSent = true;
              }
              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();
              if (dataBuffer.includes("\n")) {
                const items = [];
                const lines = dataBuffer.split("\n");

                for (let i = 0; i < lines.length; i++) {
                  const trimmedLine = lines[i]?.trim(); // Usando o operador de encadeamento opcional

                  // Verificar se a linha realmente existe e não está vazia
                  if (trimmedLine && !isNaN(parseInt(trimmedLine.charAt(0)))) {
                    const alias = trimmedLine.split(" ")[0];
                    const statusLine = lines[i + 1]?.trim();
                    const powerLevelLine = lines[i + 2]?.trim();
                    const rssiLine = lines[i + 3]?.trim();

                    const statusMatch = statusLine
                      ? statusLine.match(/Status\s*:\s*(.*)/)
                      : null;
                    const status = statusMatch ? statusMatch[1] : null;

                    const txMatch = powerLevelLine
                      ? powerLevelLine.match(/Power Level\s*:\s*(-?\d+\.\d+)/)
                      : null;
                    const tx = txMatch ? parseFloat(txMatch[1]) : null;

                    const rxMatch = rssiLine
                      ? rssiLine.match(/RSSI\s*:\s*(-?\d+\.\d+)/)
                      : null;
                    const rx = rxMatch ? parseFloat(rxMatch[1]) : null;

                    if (status && tx && rx) {
                      items.push({
                        alias: alias,
                        status: status,
                        tx: tx,
                        rx: rx,
                      });
                    }

                    i += 3;
                  }
                }
                jsonOutput = items;
              }
            });

          stream.write("terminal length 0\n");
          stream.write(`sh interface ${gpon} onu status\n`);
          stream.write("exit\n");
        });
      })
      .on("error", (err) => {
        if (!responseSent) {
          console.error(err);
          res.status(500).json({ error: "Error connecting to the OLT" });
          responseSent = true;
        }
      })
      .connect({
        host: host,
        port: 22,
        username: username,
        password: password,
      });
  };

  static VerificarNomeOnuPon = (req, res) => {
    let host = req.body.oltIp;
    let gpon = req.body.oltPon;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Error connecting to the OLT" });
            return;
          }

          let dataBuffer = "";
          let jsonOutput = []; // Change to an array to store ONU data

          stream
            .on("close", () => {
              res.json(jsonOutput); // Send the modified JSON as the response

              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();
              if (dataBuffer.includes("\n")) {
                const lines = dataBuffer.split("\n");
                dataBuffer = lines.pop();
                let onuData = {}; // Create an object to store ONU data temporarily

                for (const line of lines) {
                  // console.log("Output: " + line);

                  const onuAliasMatch = line.match(
                    /^\s*(\d+)-([\w-]+)\s+\(([\w-]+)\):/
                  );
                  if (onuAliasMatch) {
                    if (Object.keys(onuData).length > 0) {
                      jsonOutput.push(onuData); // Add the previous ONU data to the output array
                    }
                    onuData = {
                      name: onuAliasMatch[2],
                      mac: onuAliasMatch[3],
                    };
                  } else if (line.includes("Flow profile:")) {
                    onuData.flowProfile = line.split(":")[1].trim();
                  } else if (line.includes("Ports VLAN translation profile:")) {
                    onuData.portsVlanTranslation = {};
                  } else if (line.includes("Ports Ethernet profile:")) {
                    onuData.portsEthernet = {};
                  } else if (
                    onuData.portsVlanTranslation &&
                    line.includes(":")
                  ) {
                    const [port, vlan] = line
                      .split(":")
                      .map((str) => str.trim());
                    onuData.portsVlanTranslation[port] = vlan;
                  } else if (onuData.portsEthernet && line.includes(":")) {
                    const [port, status] = line
                      .split(":")
                      .map((str) => str.trim());
                    onuData.portsEthernet[port] = status;
                  }
                }

                if (Object.keys(onuData).length > 0) {
                  jsonOutput.push(onuData); // Add the last ONU data to the output array
                }
              }
            });

          stream.write("terminal length 0\n");
          stream.write(`sh interface ${gpon} onu \n`);
          stream.write("exit\n");
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Error connecting to the OLT" });
      })
      .connect({
        host: host,
        port: 22,
        username: username,
        password: password,
      });
  };

  static VerificarNomeOnuOlt = (req, res) => {
    let host = req.body.oltIp;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Error connecting to the OLT" });
            return;
          }

          let dataBuffer = "";
          let jsonOutput = [];
          let currentGpon = ""; // 👈 variável que armazena a interface atual

          stream
            .on("close", () => {
              res.json(jsonOutput);
              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();
              if (dataBuffer.includes("\n")) {
                const lines = dataBuffer.split("\n");
                dataBuffer = lines.pop();
                let onuData = {};

                for (const line of lines) {
                  const trimmedLine = line.trim();

                  // 👇 Detecta a interface atual (ex: "Interface gpon1/1")
                  const interfaceMatch =
                    trimmedLine.match(/^Interface\s+(\S+)/);
                  if (interfaceMatch) {
                    currentGpon = interfaceMatch[1]; // guarda gpon1/1
                    continue;
                  }

                  // 👇 Detecta início de uma nova ONU
                  const onuAliasMatch = trimmedLine.match(
                    /^(\d+)-([\w-]+)\s+\(([\w-]+)\):/
                  );
                  if (onuAliasMatch) {
                    if (Object.keys(onuData).length > 0) {
                      jsonOutput.push(onuData);
                    }
                    onuData = {
                      oltIp: host,
                      oltGpon: currentGpon, // 👈 adiciona aqui
                      name: onuAliasMatch[2],
                      mac: onuAliasMatch[3],
                    };
                  } else if (trimmedLine.includes("Flow profile:")) {
                    onuData.flowProfile = trimmedLine.split(":")[1].trim();
                  } else if (
                    trimmedLine.includes("Ports VLAN translation profile:")
                  ) {
                    onuData.portsVlanTranslation = {};
                  } else if (trimmedLine.includes("Ports Ethernet profile:")) {
                    onuData.portsEthernet = {};
                  } else if (
                    onuData.portsVlanTranslation &&
                    trimmedLine.includes(":")
                  ) {
                    const [port, vlan] = trimmedLine
                      .split(":")
                      .map((str) => str.trim());
                    onuData.portsVlanTranslation[port] = vlan;
                  } else if (
                    onuData.portsEthernet &&
                    trimmedLine.includes(":")
                  ) {
                    const [port, status] = trimmedLine
                      .split(":")
                      .map((str) => str.trim());
                    onuData.portsEthernet[port] = status;
                  }
                }

                if (Object.keys(onuData).length > 0) {
                  jsonOutput.push(onuData);
                }
              }
            });

          stream.write("terminal length 0\n");
          stream.write(`show gpon onu\n`);
          new Promise((resolve) => setTimeout(resolve, 300)).then(() =>
            stream.write("exit\n")
          );
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Error connecting to the OLT" });
      })
      .connect({
        host: host,
        port: 22,
        username: username,
        password: password,
      });
  };

  static listarOnu = (req, res) => {
    let host = req.body.oltIp;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Error connecting to the OLT" });
            return;
          }

          let dataBuffer = "";
          let onus = [];

          stream
            .on("close", () => {
              res.json(onus);
              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();
              if (dataBuffer.includes("\n")) {
                const lines = dataBuffer.split("\n");
                dataBuffer = lines.pop();
                for (const line of lines) {
                  if (line.includes("|") && !line.includes("Interface")) {
                    const values = line.split("|").map((value) => value.trim());
                    const [gpon, onuMac, onuModel] = values;

                    onus.push({
                      onuMac,
                      gpon,
                      onuModel,
                    });
                  }
                }
              }
            });
          stream.write("show gpon onu unconfigured\n");
          stream.write("exit\n");
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Error connecting to the OLT" });
      })
      .connect({
        host: host,
        port: 22,
        username: username,
        password: password,
      });
  };

  static EditarOnu = (req, res) => {
    const { oltGpon, newAlias, mac, oltIp } = req.body;
    const conn = new Client();
    const host = oltIp;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;

    conn
      .on("ready", () => {
        console.log("Conectado à OLT:", oltIp);

        conn.shell((err, stream) => {
          if (err) {
            console.error("Erro ao iniciar shell:", err);
            return res.status(500).json({ status: "ERROR", msg: err.message });
          }

          stream
            .on("close", () => {
              console.log("Sessão SSH encerrada.");
              conn.end();
              res
                .status(200)
                .json({ status: "OK", msg: "Onu editada com sucesso" });
            })
            .on("data", (data) => {
              console.log(data.toString()); // apenas loga o output
            })
            .stderr.on("data", (data) => {
              console.error("STDERR:", data.toString());
            });

          const comandos = [
            "configure terminal",
            `interface ${oltGpon}`,
            `onu ${mac} alias ${newAlias}`,
            "end",
            "copy r s",
            "exit", // garante fechamento do shell
          ];

          console.log("Enviando script para OLT...");
          let i = 0;

          const enviarComando = () => {
            if (i < comandos.length) {
              const cmd = comandos[i];
              stream.write(cmd + "\n");
              console.log("➡️  " + cmd);
              i++;
              setTimeout(enviarComando, 300);
            }
          };

          enviarComando();
        });
      })
      .connect({
        host,
        port: 22,
        username,
        password,
      });
  };

  static liberarOnu = (req, res) => {
    let oltIp = req.body.oltIp;
    let oltPon = req.body.oltPon;
    let onuVlan = req.body.onuVlan;
    let cto = req.body.cto;
    let tecnico = req.body.tecnico;
    let onuSerial = req.body.onuSerial;
    let onuAlias = req.body.onuAlias;
    let user = req.body.user;
    let gpon = oltPon;
    let flowProfile = `bridge_vlan_${onuVlan}`;
    let sinalTX = req.body.sinalTX;
    let sinalRX = req.body.sinalRX;
    let date_time = new Date().toLocaleString("PT-br");

    let clienteDb = {
      date_time,
      oltIp,
      oltPon,
      onuVlan,
      onuSerial,
      onuAlias,
      user,
      cto,
      tecnico,
      sinalRX,
      sinalTX,
    };
    let onuRegister = new OnuClient(clienteDb);
    onuRegister.save(console.log(`Onu salva no banco: ${clienteDb}`));

    const host = oltIp;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) throw err;
          let dataBuffer = "";
          let jsonOutput = {};

          stream
            .on("close", () => {
              res.status(200).json(jsonOutput);
              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();
              if (dataBuffer.includes("\n")) {
                const lines = dataBuffer.split("\n");
                dataBuffer = lines.pop();
                for (const line of lines) {
                  if (line.includes(":")) {
                    const [key, value] = line.split(":");
                    const trimmedKey = key.trim();
                    const trimmedValue = value.trim();

                    if (trimmedKey === "Status") {
                      jsonOutput[onuSerial] = { Status: trimmedValue };
                    } else if (
                      trimmedKey === "Power Level" ||
                      trimmedKey === "RSSI"
                    ) {
                      if (jsonOutput[onuSerial]) {
                        jsonOutput[onuSerial][trimmedKey] = trimmedValue;
                      }
                    }
                  }
                }
              }
            });

          stream.write("configure terminal\n");
          stream.write(`interface ${gpon}\n`);
          stream.write(`onu add serial-number ${onuSerial}\n`);
          stream.write(`onu ${onuSerial} alias ${onuAlias}\n`);
          stream.write(`onu ${onuSerial} flow ${flowProfile}\n`);
          stream.write(
            `onu ${onuSerial} vlan-translation-profile _${onuVlan} uni-port 1\n`
          );
          stream.write(
            `onu ${onuSerial} ethernet-profile auto-on uni-port 1\n`
          );
          stream.write("end\n");
          stream.write("copy r s\n");
          stream.write(`show gpon onu ${onuSerial} status\n`);
          stream.write("exit\n");
        });
      })
      .connect({
        host: host,
        port: 22,
        username: username,
        password: password,
      });
  };

  static deleteOnu = (req, res) => {
    const { oltIp, mac, oltGpon } = req.body;

    const conn = new Client();
    const host = oltIp;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;

    conn
      .on("ready", () => {
        console.log("Conectado à OLT:", oltIp);

        conn.shell((err, stream) => {
          if (err) {
            console.error("Erro ao iniciar shell:", err);
            return res.status(500).json({ status: "ERROR", msg: err.message });
          }

          stream
            .on("close", () => {
              console.log("Sessão SSH encerrada.");
              conn.end();
              res
                .status(200)
                .json({ status: "OK", msg: "Onu desautorizada com sucesso" });
            })
            .on("data", (data) => {
              console.log(data.toString()); // apenas loga o output
            })
            .stderr.on("data", (data) => {
              console.error("STDERR:", data.toString());
            });

          const comandos = [
            "configure terminal",
            `interface ${oltGpon}`,
            `no onu ${mac}`,
            "end",
            "copy r s",
            "exit", // garante fechamento do shell
          ];

          console.log("Enviando script para OLT...");
          let i = 0;

          const enviarComando = () => {
            if (i < comandos.length) {
              const cmd = comandos[i];
              stream.write(cmd + "\n");
              console.log("➡️  " + cmd);
              i++;
              setTimeout(enviarComando, 300);
            }
          };

          enviarComando();
        });
      })
      .connect({
        host,
        port: 22,
        username,
        password,
      });
  };

  static liberarOnuAvulsa = (req, res) => {
    const { oltIp, oltPon, script } = req.body;

    const conn = new Client();
    const host = oltIp;
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;

    conn
      .on("ready", () => {
        console.log("Conectado à OLT:", oltIp);

        conn.shell((err, stream) => {
          if (err) {
            console.error("Erro ao iniciar shell:", err);
            return res.status(500).json({ status: "ERROR", msg: err.message });
          }

          stream
            .on("close", () => {
              console.log("Sessão SSH encerrada.");
              conn.end();
              res
                .status(200)
                .json({ status: "OK", msg: "Script executado com sucesso" });
            })
            .on("data", (data) => {
              console.log(data.toString()); // apenas loga o output
            })
            .stderr.on("data", (data) => {
              console.error("STDERR:", data.toString());
            });

          const comandos = [
            "configure terminal",
            `interface ${oltPon}`,
            ...script.split("\n"),
            "end",
            "copy r s",
            "exit", // garante fechamento do shell
          ];

          console.log("Enviando script para OLT...");
          let i = 0;

          const enviarComando = () => {
            if (i < comandos.length) {
              const cmd = comandos[i];
              stream.write(cmd + "\n");
              console.log("➡️  " + cmd);
              i++;
              setTimeout(enviarComando, 300);
            }
          };

          enviarComando();
        });
      })
      .connect({
        host,
        port: 22,
        username,
        password,
      });
  };
}

export default oltController;
