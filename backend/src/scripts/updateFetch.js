import newFetchModel from "../models/newetchWithPppoe.js";
import { newFetchTomodat } from "../scripts/fetchApiTomodat.js";
import db from "../config/dbConnect.js";

import dotenv from "dotenv";

dotenv.config();

db.on("error", console.log.bind(console, "erro de conexão"));
db.once("open", async () => {
  let now = new Date().toLocaleString("PT-br");
  console.log(`conexão com o banco em: ${now}`);
});

async function updateFetchInBatches(data) {
  try {
    const updates = data.map(element => ({
      updateOne: {
        filter: { id: element.id },
        update: element,
        upsert: true,
      },
    }));
    await newFetchModel.bulkWrite(updates); // Batch update using bulkWrite
  } catch (err) {
    console.error(`Error updating data: ${err.message}`);
  }
}

async function tomodatUpdateLoop() {
  try {
    while (true) {
      const now = new Date().toLocaleString("PT-br");
      const data = await newFetchTomodat();
      await updateFetchInBatches(data);
      console.log(`Fetch successfully updated to Db at: ${now}`);
      console.log(
        `Waiting for ${3 * 60 * 1000} milliseconds before next update...`
      );
      await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000)); // Wait 3 minutes
    }
  } catch (err) {
    console.error(`Error in main loop: ${err.message}`);
  } finally {
    // Close database connection (assuming db has a close method)
    await db.close();
  }
}

export default tomodatUpdateLoop;
