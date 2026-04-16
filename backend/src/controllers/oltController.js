import ramaisModel from "../models/ramaisOlt.js";
import oltModel from "../models/oltModel.js";
import { Client } from "ssh2";
import dotenv from "dotenv";
import OnuClient from "../models/onuClient.js";
import Auditoria from "../models/auditoriaModel.js";
dotenv.config();

const SSH_READY_TIMEOUT_MS = 8000;
const SSH_OPERATION_TIMEOUT_MS = 15000;

class oltController {
  static #buildErrorPayload = (
    message,
    code = "OLT_OPERATION_ERROR",
    details,
  ) => ({
    message,
    code,
    ...(details ? { details } : {}),
  });

  static #getMissingFields = (payload, fields) =>
    fields.filter((field) => {
      const value = payload?.[field];
      return value === undefined || value === null || value === "";
    });

  static #validateRequiredFields = (res, payload, fields) => {
    const missingFields = oltController.#getMissingFields(payload, fields);

    if (missingFields.length === 0) return false;

    res.status(400).json(
      oltController.#buildErrorPayload(
        `Parametros obrigatorios ausentes: ${missingFields.join(", ")}`,
        "VALIDATION_ERROR",
      ),
    );

    return true;
  };

  static #runSshCommandSequence = ({
    host,
    commands,
    operationName,
    onData,
    onClose,
    exitDelayMs = 0,
  }) =>
    new Promise((resolve, reject) => {
      const username = process.env.PARKS_USERNAME;
      const password = `#${process.env.PARKS_PASSWORD}`;
      const conn = new Client();
      let timeoutId;
      let finished = false;

      const finish = (error, result) => {
        if (finished) return;
        finished = true;

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        try {
          conn.end();
        } catch (closeError) {
          console.error(
            "Erro ao encerrar conexao SSH:",
            closeError?.message || closeError,
          );
        }

        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      };

      timeoutId = setTimeout(() => {
        const timeoutError = new Error(
          `Timeout ao executar operacao de OLT: ${operationName}`,
        );
        timeoutError.code = "OLT_TIMEOUT";
        finish(timeoutError);
      }, SSH_OPERATION_TIMEOUT_MS);

      conn
        .on("ready", () => {
          conn.shell((err, stream) => {
            if (err) {
              const shellError = new Error("Erro ao abrir shell SSH");
              shellError.code = "OLT_SHELL_ERROR";
              shellError.cause = err;
              finish(shellError);
              return;
            }

            stream
              .on("data", (data) => {
                try {
                  onData?.(data.toString(), stream);
                } catch (processingError) {
                  finish(processingError);
                }
              })
              .on("close", () => {
                try {
                  finish(null, onClose?.());
                } catch (closeError) {
                  finish(closeError);
                }
              });

            if (stream.stderr) {
              stream.stderr.on("data", (data) => {
                console.error("STDERR:", data.toString());
              });
            }

            commands.forEach((command, index) => {
              setTimeout(() => {
                if (!finished) {
                  stream.write(`${command}\n`);
                }
              }, index * 300);
            });

            const lastCommandDelay = commands.length * 300;
            const exitDelay = exitDelayMs ? lastCommandDelay + exitDelayMs : lastCommandDelay;

            setTimeout(() => {
              if (!finished) {
                stream.write("exit\n");
              }
            }, exitDelay);
          });
        })
        .on("error", (err) => {
          const connectionError = new Error("Erro ao conectar na OLT");
          connectionError.code = "OLT_CONNECTION_ERROR";
          connectionError.cause = err;
          finish(connectionError);
        })
        .connect({
          host,
          port: 22,
          username,
          password,
          readyTimeout: SSH_READY_TIMEOUT_MS,
        });
    });

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

  static editRamal = (req, res) => {
    try {
      const { _id } = req.body;
      ramaisModel.findByIdAndUpdate({ _id }, { ...req.body }, (err, doc) => {
        if (!err)
          res.status(200).send({ message: "Ramal atualizada com sucesso." });
        else res.status(500).send({ message: `erro: ${err.message}` });
      });
    } catch (error) {
      throw error;
    }
  };

  static deleteRamal = (req, res) => {
    try {
      const { _id } = req.body;
      ramaisModel.findByIdAndDelete({ _id }, (err, doc) => {
        if (!err)
          res.status(200).send({ message: "Ramal deletada com sucesso." });
        else res.status(500).send({ message: `erro: ${err.message}` });
      });
    } catch (error) {
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

    if (oltController.#validateRequiredFields(res, req.body, ["oltIp"])) {
      return;
    }

    let dataBuffer = "";
    const perfis = [];
    let currentPerfil = null;

    const processDataBuffer = (buffer) => {
      const lines = buffer.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();

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

        if (
          !trimmed.includes("|") &&
          !/^\d+$/.test(trimmed) &&
          trimmed !== "-"
        ) {
          if (currentPerfil && currentPerfil.entries.length > 0) {
            perfis.push(currentPerfil);
          }

          currentPerfil = {
            name: trimmed,
            entries: [],
          };
          continue;
        }

        if (trimmed.includes("|") && currentPerfil) {
          const values = trimmed
            .split("|")
            .map((v) => v.trim())
            .filter((v) => v !== "");

          if (values.length >= 8 && !isNaN(parseInt(values[0], 10))) {
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
              index: parseInt(index, 10),
              type,
              vlan: vlan !== "-" ? parseInt(vlan, 10) : vlan,
              cos: cos !== "-" ? cos : null,
              encryption,
              downstream: parseInt(downstream, 10),
              bandwidthName,
              shared: shared === "Yes",
              pbmpPorts: pbmpPorts || "",
            });
          }
        }
      }
    };

    oltController
      .#runSshCommandSequence({
        host,
        commands: ["terminal length 0", "sh gpon profile flow"],
        exitDelayMs: 300,
        operationName: "listar perfis GPON",
        onData: (chunk) => {
          dataBuffer += chunk;

          const lines = dataBuffer.split("\n");
          dataBuffer = lines.pop() ?? "";

          for (const line of lines) {
            processDataBuffer(`${line}\n`);
          }
        },
        onClose: () => {
          if (dataBuffer.trim()) {
            processDataBuffer(dataBuffer);
          }

          if (currentPerfil) {
            perfis.push(currentPerfil);
          }

          return perfis;
        },
      })
      .then((profiles) => {
        res.status(200).json(profiles);
      })
      .catch((error) => {
        console.error("Erro ao listar perfis GPON:", error);
        const status = error.code === "OLT_TIMEOUT" ? 504 : 500;
        res.status(status).json(
          oltController.#buildErrorPayload(
            "Nao foi possivel carregar os perfis GPON da OLT.",
            error.code || "OLT_PROFILE_ERROR",
            error.message,
          ),
        );
      });
  };

  static VerificarVlanTranslation = (req, res) => {
    const host = req.body.oltIp;

    if (oltController.#validateRequiredFields(res, req.body, ["oltIp"])) {
      return;
    }

    let dataBuffer = "";
    const translations = [];
    let currentTranslation = null;

    const processDataBuffer = (buffer) => {
      const lines = buffer.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();

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

        if (trimmed.startsWith("_") && trimmed.includes(":")) {
          if (currentTranslation && currentTranslation.entries.length > 0) {
            translations.push(currentTranslation);
          }

          currentTranslation = {
            name: trimmed.replace(":", "").trim(),
            entries: [],
          };
          continue;
        }

        if (trimmed.includes("|") && currentTranslation) {
          const values = trimmed
            .split("|")
            .map((v) => v.trim())
            .filter((v) => v !== "");

          if (values.length >= 6 && !isNaN(parseInt(values[0], 10))) {
            const [index, mode, vlanX, vlanC, filterPrio, vlanPrio] = values;
            const direction = values[6] || "";

            currentTranslation.entries.push({
              index: parseInt(index, 10),
              mode,
              vlanX: vlanX !== "-" ? parseInt(vlanX, 10) : vlanX,
              vlanC: vlanC !== "-" ? parseInt(vlanC, 10) : vlanC,
              filterPrio: filterPrio !== "-" ? filterPrio : null,
              vlanPrio: vlanPrio !== "-" ? parseInt(vlanPrio, 10) : vlanPrio,
              direction,
            });
          }
        }
      }
    };

    oltController
      .#runSshCommandSequence({
        host,
        commands: ["terminal length 0", "sh gpon profile vlan-translation"],
        exitDelayMs: 300,
        operationName: "listar vlan translations",
        onData: (chunk) => {
          dataBuffer += chunk;
          const lines = dataBuffer.split("\n");
          dataBuffer = lines.pop() ?? "";

          for (const line of lines) {
            processDataBuffer(`${line}\n`);
          }
        },
        onClose: () => {
          if (dataBuffer.trim()) {
            processDataBuffer(dataBuffer);
          }

          if (currentTranslation) {
            translations.push(currentTranslation);
          }

          return translations;
        },
      })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((error) => {
        console.error("Erro ao listar VLAN translations:", error);
        const status = error.code === "OLT_TIMEOUT" ? 504 : 500;
        res.status(status).json(
          oltController.#buildErrorPayload(
            "Nao foi possivel carregar as configuracoes de VLAN da OLT.",
            error.code || "OLT_VLAN_TRANSLATION_ERROR",
            error.message,
          ),
        );
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
    const host = req.body.oltIp;
    const onuAlias = req.body.onuAlias;

    if (
      oltController.#validateRequiredFields(res, req.body, ["oltIp", "onuAlias"])
    ) {
      return;
    }

    let dataBuffer = "";
    const jsonOutput = {};

    oltController
      .#runSshCommandSequence({
        host,
        commands: [`show gpon onu ${onuAlias} summary`],
        operationName: "consultar resumo da ONU",
        onData: (chunk) => {
          dataBuffer += chunk;

          if (!dataBuffer.includes("\n")) {
            return;
          }

          const lines = dataBuffer.split("\n");
          dataBuffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.includes(":")) continue;

            const [key, ...values] = line.split(":");
            jsonOutput[key.trim()] = values.join(":").trim();
          }
        },
        onClose: () => {
          if (dataBuffer.includes(":")) {
            const [key, ...values] = dataBuffer.split(":");
            jsonOutput[key.trim()] = values.join(":").trim();
          }

          return jsonOutput;
        },
      })
      .then((summary) => {
        res.status(200).json(summary);
      })
      .catch((error) => {
        console.error("Erro ao consultar resumo da ONU:", error);
        const status = error.code === "OLT_TIMEOUT" ? 504 : 500;
        res.status(status).json(
          oltController.#buildErrorPayload(
            "Nao foi possivel consultar o resumo da ONU na OLT.",
            error.code || "OLT_ONU_SUMMARY_ERROR",
            error.message,
          ),
        );
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

                  // Verificar se a linha realmente existe e nÃ£o estÃ¡ vazia
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

                    if (status) {
                      items.push({
                        alias: alias,
                        status: status,
                        tx: tx || "N/A",
                        rx: rx || "N/A",
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

  static VerificarOnuAliasMac = (req, res) => {
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
                res.json(jsonOutput);
                responseSent = true;
              }
              conn.end();
            })
            .on("data", (data) => {
              dataBuffer += data.toString();
            });

          stream.on("end", () => {
            const items = [];
            const lines = dataBuffer.split("\n");

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]?.trim();

              if (!line) continue;

              // Captura linhas como:
              // 81-ANTONIO-WISSINHESKI (prks00dc219b):
              // 82-itbs5f5f4174:
              // 83-JHENIFER-O-42076 (prks00d77ec8):
              // 84-prks00dc1dc7:
              const match = line.match(/^(\d+)-(.+?):$/);

              if (match) {
                const rawValue = match[2].trim();

                let alias = null;
                let mac = null;

                // Caso tenha alias + mac entre parÃªnteses
                // Ex: ANTONIO-WISSINHESKI (prks00dc219b)
                const aliasMacMatch = rawValue.match(/^(.*?)\s*\(([^)]+)\)$/);

                if (aliasMacMatch) {
                  alias = aliasMacMatch[1]?.trim() || null;
                  mac = aliasMacMatch[2]?.trim() || null;
                } else {
                  // Caso venha apenas algo como:
                  // itbs5f5f4174
                  // prks00dc1dc7
                  mac = rawValue;
                  alias = null;
                }

                // Se quiser normalizar o mac/serial em maiÃºsculo
                if (mac) {
                  mac = mac.toUpperCase();
                }

                items.push({
                  alias: alias || null,
                  mac: mac || null,
                });
              }
            }

            jsonOutput = items;
          });

          stream.write("terminal length 0\n");
          stream.write(`sh interface ${gpon} onu\n`);
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
                    /^\s*(\d+)-([\w-]+)\s+\(([\w-]+)\):/,
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
          let currentGpon = ""; // ðŸ‘ˆ variÃ¡vel que armazena a interface atual

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

                  // ðŸ‘‡ Detecta a interface atual (ex: "Interface gpon1/1")
                  const interfaceMatch =
                    trimmedLine.match(/^Interface\s+(\S+)/);
                  if (interfaceMatch) {
                    currentGpon = interfaceMatch[1]; // guarda gpon1/1
                    continue;
                  }

                  // ðŸ‘‡ Detecta inÃ­cio de uma nova ONU
                  const onuAliasMatch = trimmedLine.match(
                    /^(\d+)-([\w-]+)\s+\(([\w-]+)\):/,
                  );
                  if (onuAliasMatch) {
                    if (Object.keys(onuData).length > 0) {
                      jsonOutput.push(onuData);
                    }
                    onuData = {
                      oltIp: host,
                      oltGpon: currentGpon, // ðŸ‘ˆ adiciona aqui
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
            stream.write("exit\n"),
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
    const host = req.body.oltIp;

    if (oltController.#validateRequiredFields(res, req.body, ["oltIp"])) {
      return;
    }

    let dataBuffer = "";
    const onus = [];

    oltController
      .#runSshCommandSequence({
        host,
        commands: ["show gpon onu unconfigured"],
        operationName: "listar ONUs nao autorizadas",
        onData: (chunk) => {
          dataBuffer += chunk;
          if (!dataBuffer.includes("\n")) {
            return;
          }

          const lines = dataBuffer.split("\n");
          dataBuffer = lines.pop() ?? "";

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
        },
        onClose: () => onus,
      })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((error) => {
        console.error("Erro ao listar ONUs:", error);
        const status = error.code === "OLT_TIMEOUT" ? 504 : 500;
        res.status(status).json(
          oltController.#buildErrorPayload(
            "Nao foi possivel listar as ONUs nao autorizadas da OLT.",
            error.code || "OLT_UNAUTHORIZED_ONU_LIST_ERROR",
            error.message,
          ),
        );
      });
  };

  static EditarOnu = (req, res) => {
    const { oltGpon, newAlias, mac, oltIp } = req.body;

    if (
      oltController.#validateRequiredFields(res, req.body, [
        "oltGpon",
        "newAlias",
        "mac",
        "oltIp",
      ])
    ) {
      return;
    }

    const auditoriaEntry = new Auditoria({
      user: req.user.name,
      status: "editado",
      message: `novo alias: ${newAlias} atribuido a cpe ${mac}`,
      type: "cpe",
      client: newAlias,
      ipAddress: req.clientIP,
    });

    auditoriaEntry.save().catch((error) => {
      console.error("Erro ao salvar auditoria de edicao da ONU:", error);
    });

    oltController
      .#runSshCommandSequence({
        host: oltIp,
        commands: [
          "configure terminal",
          `interface ${oltGpon}`,
          `onu ${mac} alias ${newAlias}`,
          "end",
          "copy r s",
        ],
        operationName: "editar alias da ONU",
      })
      .then(() => {
        res.status(200).json({
          status: "OK",
          message: "Onu editada com sucesso",
        });
      })
      .catch((error) => {
        console.error("Erro ao editar ONU:", error);
        const status = error.code === "OLT_TIMEOUT" ? 504 : 500;
        res.status(status).json(
          oltController.#buildErrorPayload(
            "Nao foi possivel atualizar o alias da ONU na OLT.",
            error.code || "OLT_EDIT_ONU_ERROR",
            error.message,
          ),
        );
      });
  };

  static #fetchGponProfiles = (oltIp) => {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const username = process.env.PARKS_USERNAME;
      const password = `#${process.env.PARKS_PASSWORD}`;

      conn
        .on("ready", () => {
          conn.shell((err, stream) => {
            if (err) return reject(err);

            let dataBuffer = "";
            let perfis = [];
            let currentPerfil = null;

            const processDataBuffer = (buffer) => {
              for (const line of buffer.split("\n")) {
                const trimmed = line.trim();
                if (
                  !trimmed ||
                  trimmed.startsWith("Index") ||
                  trimmed.startsWith("----") ||
                  trimmed.includes("show") ||
                  trimmed.includes("exit") ||
                  trimmed.includes("terminal length")
                )
                  continue;

                if (
                  !trimmed.includes("|") &&
                  !/^\d+$/.test(trimmed) &&
                  trimmed !== "-"
                ) {
                  if (currentPerfil && currentPerfil.entries.length > 0)
                    perfis.push(currentPerfil);
                  currentPerfil = { name: trimmed, entries: [] };
                  continue;
                }

                if (trimmed.includes("|") && currentPerfil) {
                  const values = trimmed
                    .split("|")
                    .map((v) => v.trim())
                    .filter((v) => v !== "");
                  if (values.length >= 8 && !isNaN(parseInt(values[0]))) {
                    const normalized =
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
                    ] = normalized;
                    currentPerfil.entries.push({
                      index: parseInt(index),
                      type,
                      vlan: vlan !== "-" ? parseInt(vlan) : vlan,
                      cos: cos !== "-" ? cos : null,
                      encryption,
                      downstream: parseInt(downstream),
                      bandwidthName,
                      shared: shared === "Yes",
                      pbmpPorts: pbmpPorts || "",
                    });
                  }
                }
              }
            };

            stream
              .on("close", () => {
                if (dataBuffer.trim()) processDataBuffer(dataBuffer);
                if (currentPerfil) perfis.push(currentPerfil);
                conn.end();
                resolve(perfis);
              })
              .on("data", (data) => {
                dataBuffer += data.toString();
                const lines = dataBuffer.split("\n");
                dataBuffer = lines.pop();
                for (const line of lines) processDataBuffer(line + "\n");
              });

            stream.write("terminal length 0\n");
            stream.write("sh gpon profile flow\n");
            new Promise((r) => setTimeout(r, 300)).then(() =>
              stream.write("exit\n"),
            );
          });
        })
        .on("error", reject)
        .connect({ host: oltIp, port: 22, username, password });
    });
  };

  static #resolveFlowProfile = (profiles, onuVlan, useVeipService) => {
    const vlan = parseInt(onuVlan);
    const matching = profiles.filter((p) =>
      p.entries.some((e) => e.vlan === vlan),
    );
    if (useVeipService) {
      return (
        matching.find(
          (p) =>
            p.entries.some((e) => e.type === "VEIP") &&
            p.name.startsWith("router"),
        )?.name ?? ""
      );
    }
    return (
      matching.find(
        (p) =>
          p.entries.every((e) => e.type !== "VEIP") &&
          p.name.startsWith("bridge"),
      )?.name ?? ""
    );
  };

  static liberarOnu = async (req, res) => {
    const {
      oltIp,
      oltPon,
      onuVlan,
      cto,
      tecnico,
      onuSerial,
      onuAlias,
      user,
      useVeipService,
      sinalTX,
      sinalRX,
    } = req.body;
    const date_time = new Date().toLocaleString("PT-br");

    if (
      oltController.#validateRequiredFields(res, req.body, [
        "oltIp",
        "oltPon",
        "onuVlan",
        "onuSerial",
        "onuAlias",
      ])
    ) {
      return;
    }

    let flowProfile = "";
    try {
      const profiles = await oltController.#fetchGponProfiles(oltIp);
      flowProfile = oltController.#resolveFlowProfile(
        profiles,
        onuVlan,
        useVeipService,
      );
    } catch (error) {
      console.error("Erro ao buscar perfis GPON:", error);
      const status = error.code === "OLT_TIMEOUT" ? 504 : 500;
      return res.status(status).json(
        oltController.#buildErrorPayload(
          "Nao foi possivel carregar os perfis GPON necessarios para provisionar a ONU.",
          error.code || "OLT_PROFILE_FETCH_ERROR",
          error.message,
        ),
      );
    }

    if (!flowProfile) {
      return res.status(400).json(
        oltController.#buildErrorPayload(
          "Perfil de fluxo nao encontrado para a VLAN informada.",
          "OLT_FLOW_PROFILE_NOT_FOUND",
        ),
      );
    }

    const clienteDb = {
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

    const commands = !useVeipService
      ? [
          "configure terminal",
          `interface ${oltPon}`,
          `onu add serial-number ${onuSerial}`,
          `onu ${onuSerial} alias ${onuAlias}`,
          `onu ${onuSerial} flow ${flowProfile}`,
          `onu ${onuSerial} vlan-translation-profile _${onuVlan} uni-port 1`,
          `onu ${onuSerial} ethernet-profile auto-on uni-port 1`,
          "end",
          "copy r s",
          `show gpon onu ${onuSerial} status`,
        ]
      : [
          "configure terminal",
          `interface ${oltPon}`,
          `onu add serial-number ${onuSerial}`,
          `onu ${onuSerial} ethernet-profile auto-on uni-port 1-2`,
          `onu ${onuSerial} alias ${onuAlias}`,
          `onu ${onuSerial} flow ${flowProfile}`,
          "end",
          "copy r s",
          `show gpon onu ${onuSerial} status`,
        ];

    let dataBuffer = "";
    const jsonOutput = {};

    oltController
      .#runSshCommandSequence({
        host: oltIp,
        commands,
        operationName: "provisionar ONU",
        onData: (chunk) => {
          dataBuffer += chunk;
          if (!dataBuffer.includes("\n")) {
            return;
          }

          const lines = dataBuffer.split("\n");
          dataBuffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.includes(":")) {
              continue;
            }

            const [key, value] = line.split(":");
            const trimmedKey = key.trim();
            const trimmedValue = value.trim();

            if (trimmedKey === "Status") {
              jsonOutput[onuSerial] = { Status: trimmedValue };
            } else if (
              (trimmedKey === "Power Level" || trimmedKey === "RSSI") &&
              jsonOutput[onuSerial]
            ) {
              jsonOutput[onuSerial][trimmedKey] = trimmedValue;
            }
          }
        },
        onClose: () => jsonOutput,
      })
      .then(async (result) => {
        try {
          await new OnuClient(clienteDb).save();
        } catch (error) {
          console.error("Erro ao salvar ONU provisionada no banco:", error);
        }

        try {
          await new Auditoria({
            user: req.user.name,
            status: "cadastrado",
            message: `cpe ${onuSerial} provisionada na olt ${oltIp} | interface ${oltPon}. sinal TX: ${sinalTX} | sinal RX: ${sinalRX} | cto: ${cto} | tecnico: ${tecnico}`,
            type: "cpe",
            client: onuAlias,
            ipAddress: req.clientIP,
          }).save();
        } catch (error) {
          console.error("Erro ao salvar auditoria de provisionamento:", error);
        }

        res.status(200).json(result);
      })
      .catch((error) => {
        console.error("Erro ao provisionar ONU:", error);
        const status = error.code === "OLT_TIMEOUT" ? 504 : 500;
        res.status(status).json(
          oltController.#buildErrorPayload(
            "Nao foi possivel provisionar a ONU na OLT.",
            error.code || "OLT_PROVISION_ERROR",
            error.message,
          ),
        );
      });
  };

  static deleteOnu = (req, res) => {
    const { oltIp, mac, oltGpon, alias } = req.body;

    if (
      oltController.#validateRequiredFields(res, req.body, [
        "oltIp",
        "mac",
        "oltGpon",
      ])
    ) {
      return;
    }

    new Auditoria({
      user: req.user.name,
      status: "deletado",
      message: `cpe ${mac} desprovisionada na olt ${oltIp} | interface ${oltGpon}.`,
      type: "cpe",
      client: alias,
      ipAddress: req.clientIP,
    })
      .save()
      .catch((error) => {
        console.error("Erro ao salvar auditoria de remocao da ONU:", error);
      });

    oltController
      .#runSshCommandSequence({
        host: oltIp,
        commands: [
          "configure terminal",
          `interface ${oltGpon}`,
          `no onu ${mac}`,
          "end",
          "copy r s",
        ],
        operationName: "remover ONU",
      })
      .then(() => {
        res.status(200).json({
          status: "OK",
          message: "Onu desautorizada com sucesso",
        });
      })
      .catch((error) => {
        console.error("Erro ao remover ONU:", error);
        const status = error.code === "OLT_TIMEOUT" ? 504 : 500;
        res.status(status).json(
          oltController.#buildErrorPayload(
            "Nao foi possivel desautorizar a ONU na OLT.",
            error.code || "OLT_DELETE_ONU_ERROR",
            error.message,
          ),
        );
      });
  };

  static liberarOnuAvulsa = (req, res) => {
    const { oltIp, oltPon, script, onuAlias } = req.body;

    if (
      oltController.#validateRequiredFields(res, req.body, [
        "oltIp",
        "oltPon",
        "script",
      ])
    ) {
      return;
    }

    new Auditoria({
      user: req.user.name,
      status: "cadastrado",
      message: `cpe provisionada na olt ${oltIp} | interface ${oltPon}. script: ${script}`,
      type: "cpe",
      client: onuAlias,
      ipAddress: req.clientIP,
    })
      .save()
      .catch((error) => {
        console.error("Erro ao salvar auditoria de provisionamento avulso:", error);
      });

    oltController
      .#runSshCommandSequence({
        host: oltIp,
        commands: [
          "configure terminal",
          `interface ${oltPon}`,
          ...script.split("\n"),
          "end",
          "copy r s",
        ],
        operationName: "executar script avulso na OLT",
      })
      .then(() => {
        res.status(200).json({
          status: "OK",
          message: "Script executado com sucesso",
        });
      })
      .catch((error) => {
        console.error("Erro ao executar script avulso:", error);
        const status = error.code === "OLT_TIMEOUT" ? 504 : 500;
        res.status(status).json(
          oltController.#buildErrorPayload(
            "Nao foi possivel executar o script na OLT.",
            error.code || "OLT_SCRIPT_EXECUTION_ERROR",
            error.message,
          ),
        );
      });
  };

  static addOlt = (req, res) => {
    const olt = new oltModel(req.body);
    olt.save((err) => {
      if (err) {
        res
          .status(500)
          .send({ message: `${err.message} - falha ao cadastrar OLT.` });
      } else {
        res.status(201).send(olt.toJSON());
      }
    });
  };

  static listOlts = (req, res) => {
    oltModel.find((err, olt) => {
      if (err) {
        return res.status(500).send(
          oltController.#buildErrorPayload(
            `${err.message} - falha ao buscar OLT.`,
            "OLT_LIST_ERROR",
          ),
        );
      }

      res.status(200).send(olt);
    });
  };

  static updateOlt = (req, res) => {
    const hubsoftId = req.body.hubsoft_id;

    if (oltController.#validateRequiredFields(res, req.body, ["hubsoft_id"])) {
      return;
    }

    oltModel.findOneAndUpdate(
      { hubsoft_id: hubsoftId },
      { $set: req.body },
      { new: true },
      (err, oltAtualizada) => {
        if (err) {
          return res.status(500).send(
            oltController.#buildErrorPayload(
              `${err.message} - falha ao atualizar OLT.`,
              "OLT_UPDATE_ERROR",
            ),
          );
        }

        if (!oltAtualizada) {
          return res.status(404).send(
            oltController.#buildErrorPayload(
              "OLT nao encontrada.",
              "OLT_NOT_FOUND",
            ),
          );
        }

        res.status(200).send({
          message: "OLT atualizada com sucesso.",
          data: oltAtualizada,
        });
      },
    );
  };

  static deleteOlt = (req, res) => {
    const id = req.params.id;
    oltModel.deleteOne({ _id: id }, (err) => {
      if (err) {
        res
          .status(500)
          .send({ message: `${err.message} - falha ao deletar OLT.` });
      } else {
        res.status(200).send({ message: "OLT deletada com sucesso." });
      }
    });
  };

  static toggleOltActiveStatus = (req, res) => {
    const { id, status } = req.body;

    if (oltController.#validateRequiredFields(res, req.body, ["id", "status"])) {
      return;
    }

    oltModel.findOne({ hubsoft_id: id }, (err, olt) => {
      if (err) {
        return res.status(500).send(
          oltController.#buildErrorPayload(
            `${err.message} - falha ao buscar OLT.`,
            "OLT_STATUS_LOOKUP_ERROR",
          ),
        );
      }

      if (!olt) {
        return res.status(404).send(
          oltController.#buildErrorPayload(
            "OLT nao encontrada.",
            "OLT_NOT_FOUND",
          ),
        );
      }

      olt.active = status;
      olt.save((saveError) => {
        if (saveError) {
          return res.status(500).send(
            oltController.#buildErrorPayload(
              `${saveError.message} - falha ao atualizar OLT.`,
              "OLT_STATUS_UPDATE_ERROR",
            ),
          );
        }

        res.status(200).send(olt.toJSON());
      });
    });
  };
}

export default oltController;


