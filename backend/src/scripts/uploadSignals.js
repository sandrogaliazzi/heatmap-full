import mongoose from "mongoose";
import { Client } from "ssh2";
import dotenv from "dotenv";
import cron from "node-cron";
import net from "net";
dotenv.config();

mongoose.connect(process.env.MONGO_DB_ACCESS);

import Ramal from "../models/ramaisOlt.js";
import RamalLog from "../models/ramalModel.js";

async function getRamais() {
  try {
    return await Ramal.find().sort({ _id: -1 }).exec();
  } catch (error) {
    console.error("Erro ao listar ramais:", error);
  }
}

async function isExecutionNeeded() {
  try {
    const today = new Date().toISOString().split("T")[0]; // Pega a data atual no formato "YYYY-MM-DD"
    const lastLog = await RamalLog.findOne().sort({ date_time: -1 }).exec();

    if (lastLog) {
      const lastLogDate = new Date(lastLog.date_time)
        .toISOString()
        .split("T")[0];

      return lastLogDate !== today; // Só executa se não houver log de hoje
    }

    return true; // Se não houver logs, executa
  } catch (error) {
    console.error("Erro ao verificar logs existentes:", error);
    return true; // Em caso de erro, evita bloquear a execução
  }
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

async function getOnusFromOltPon(oltIp, slot, pon) {
  if (!oltIp || !slot || !pon) {
    return {
      error: "oltIp, slot e pon são obrigatórios",
    };
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
        return resolve({
          error: "Timeout ao consultar o UNM2000",
        });
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

        return resolve({ onus });
      }
    });

    client.on("error", (err) => {
      if (!responded) {
        responded = true;
        client.destroy();
        return resolve({
          error: `Erro de conexão UNM2000: ${err.message}`,
        });
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

function toFloat(value) {
  if (!value || value === "--") return null;
  return parseFloat(value.replace(",", "."));
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

function formatSignalValue(value) {
  return parseFloat(value.split("dBm")[0].trim());
}

async function getOnuOpticalPower(onus) {
  if (!Array.isArray(onus) || onus.length === 0) {
    return { error: "Array de ONUs inválido" };
  }

  return new Promise((resolve) => {
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
      return resolve({ results });
    });

    client.on("error", (err) => {
      client.end();
      return resolve({ error: err.message });
    });
  });
}

async function SaveRamalLog(logData) {
  try {
    const { id } = logData;
    logData.date_time = new Date().toISOString();

    const logCount = await RamalLog.countDocuments({ id });

    if (logCount >= 30) {
      const oldestLog = await RamalLog.findOne({ id })
        .sort({ date_time: 1 })
        .exec();
      if (oldestLog) {
        await RamalLog.deleteOne({ _id: oldestLog._id });
      }
    }

    const newLog = new RamalLog(logData);
    await newLog.save();
  } catch (err) {
    console.error(`${err.message} - falha ao cadastrar Logs`);
  }
}

function calculateAverages(data) {
  if (data.length === 0) return { avgTx: null, avgRx: null };

  const totalTx = data.reduce(
    (sum, item) =>
      sum + (item.tx || formatSignalValue(item["Power Level"]) || 0),
    0,
  );
  const totalRx = data.reduce(
    (sum, item) => sum + (item.rx || formatSignalValue(item.RSSI) || 0),
    0,
  );

  return {
    tx: parseFloat((totalTx / data.length).toFixed(2)),
    rx: parseFloat((totalRx / data.length).toFixed(2)),
  };
}

function VerificarSinalPon(oltIp, oltPon) {
  return new Promise((resolve, reject) => {
    const username = process.env.PARKS_USERNAME;
    const password = `#${process.env.PARKS_PASSWORD}`;
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.shell((err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          let dataBuffer = "";
          let jsonOutput = null;

          stream
            .on("close", () => {
              conn.end();
              resolve(jsonOutput);
            })
            .on("data", (data) => {
              dataBuffer += data.toString();
              if (dataBuffer.includes("\n")) {
                const items = [];
                const lines = dataBuffer.split("\n");

                for (let i = 0; i < lines.length; i++) {
                  const trimmedLine = lines[i]?.trim();

                  if (trimmedLine && !isNaN(parseInt(trimmedLine.charAt(0)))) {
                    const alias = trimmedLine.split(" ")[0];
                    const statusMatch =
                      lines[i + 1]?.match(/Status\s*:\s*(.*)/);
                    const txMatch = lines[i + 2]?.match(
                      /Power Level\s*:\s*(-?\d+\.\d+)/,
                    );
                    const rxMatch = lines[i + 3]?.match(
                      /RSSI\s*:\s*(-?\d+\.\d+)/,
                    );

                    if (statusMatch && txMatch && rxMatch) {
                      items.push({
                        alias,
                        status: statusMatch[1],
                        tx: parseFloat(txMatch[1]),
                        rx: parseFloat(rxMatch[1]),
                      });
                    }

                    i += 3;
                  }
                }
                jsonOutput = items;
              }
            });

          stream.write("terminal length 0\n");
          stream.write(`sh interface ${oltPon} onu status\n`);
          stream.write("exit\n");
        });
      })
      .on("error", reject)
      .connect({ host: oltIp, port: 22, username, password });
  });
}

async function savePongSignals() {
  if (!(await isExecutionNeeded())) {
    console.log("Execução ignorada, já há registros para hoje.");
    return;
  }

  const ramais = await getRamais();
  console.log("Cadastro de sinais iniciado");

  for (const ramal of ramais) {
    const { oltIp, oltPon, _id, oltName } = ramal;

    let ponSignal = [];

    if (oltName.includes("FIBERHOME")) {
      const [slot, pon] = oltPon.split("/");
      const onuList = await getOnusFromOltPon(oltIp, slot, pon);
      if (onuList.error) {
        console.error(
          `Erro ao obter ONUs para ${oltIp} ${oltPon}: ${onuList.error}`,
        );
        continue;
      }
      const opticalData = await getOnuOpticalPower(onuList.onus);
      if (opticalData.error) {
        console.error(
          `Erro ao obter dados ópticos para ${oltIp} ${oltPon}: ${opticalData.error}`,
        );
        continue;
      }
      ponSignal = opticalData.results;
    } else {
      //ponSignal = await VerificarSinalPon(oltIp, oltPon);
    }

    if (ponSignal.length > 0) {
      SaveRamalLog({
        id: _id.toString(),
        date_time: new Date().toISOString(), // Salva em formato ISO
        gpon_data: ponSignal,
        avgSignal: calculateAverages(ponSignal),
      });
    }
  }

  console.log("Sinais cadastrados com sucesso.");
}

export async function getPonSignals() {
  // const ramais = await getRamais();

  const ramais = [
    {
      oltIp: "192.168.213.2",
      oltPon: "gpon1/1",
      oltRamal: "RAMAL 1",
      oltName: "OLT 13 PRB",
    },
    {
      oltIp: "192.168.213.2",
      oltPon: "gpon1/2",
      oltRamal: "RAMAL 2",
      oltName: "OLT 13 PRB",
    },
  ];

  const ramals = [];

  for (const ramal of ramais) {
    const { oltIp, oltPon, oltRamal, oltName } = ramal;
    const ponSignal = await VerificarSinalPon(oltIp, oltPon);

    if (ponSignal.length > 0) {
      const data = ponSignal.map((pon) => ({
        oltIp,
        oltPon,
        oltRamal,
        oltName,
        ...pon,
      }));
      ramals.push(data);
    }
  }

  return ramals.flat();
}

export default function startUpdateLoop() {
  console.log("Agendando coleta diária de sinais (00:30)...");

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CRON JOB → 00:30 todos os dias
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  cron.schedule("30 0 * * *", async () => {
    console.log("Cron executando coleta às 00:30...");
    await savePongSignals();
  });
}
