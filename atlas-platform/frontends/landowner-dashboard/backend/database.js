import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, "data", "fully_synced_master_dataset_with_coords.csv");
const DB_FILE = path.join(__dirname, "db_store.json");

export const store = {
  users: [
    {
      id: "LO-88349",
      passcode: "1234",
      name: "Vikram Verma",
      role: "Official Landowner",
      photoInitials: "VV",
      phone: "+91 98765 43210",
      email: "vikram.verma@example.in",
      address: "Chinhat, Lucknow, Uttar Pradesh",
      bankAccount: "SBI •••• 4421",
      ifsc: "SBIN0001234",
      pan: "ABCDE1234F",
      aadhaar: "•••• •••• 8912",
    },
  ],
  parcels: [],
  notifications: [
    {
      id: "N-1",
      user_id: "LO-88349",
      title: "Award Declaration Published",
      message: "Section 37 award notice issued for survey 205/1.",
      date: "2026-03-01",
      read: false,
      type: "info",
    },
    {
      id: "N-2",
      user_id: "LO-88349",
      title: "Disbursement Processed",
      message: "Compensation tranche released to your linked bank account.",
      date: "2026-02-22",
      read: true,
      type: "success",
    },
  ],
  complaints: [
    {
      id: "CMP-1042",
      user_id: "LO-88349",
      category: "Valuation",
      parcelId: "UP-LKO-2026-10000",
      subject: "Solatium calculation clarification",
      description: "Requesting breakdown verification for asset valuation.",
      status: "In Review",
      priority: "Medium",
      dateFiled: "2026-02-14",
      lastUpdate: "2026-02-20",
    },
  ],
  documents: [],
};

export function saveStore() {
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

export function initDatabase() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(DB_FILE)) {
      try {
        const saved = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        Object.assign(store, saved);
        console.log(`Loaded ${store.parcels.length} parcels from store.`);
        return resolve();
      } catch (e) {
        console.warn("Re-seeding from CSV...");
      }
    }

    if (!fs.existsSync(CSV_PATH)) {
      console.warn("CSV dataset missing at:", CSV_PATH);
      return resolve();
    }

    const rows = [];
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        rows.push({
          parcel_uuid: row.parcel_uuid,
          project_id: row.project_id,
          project_type: row.project_type,
          state: row.state,
          district: row.district,
          village: row.village,
          survey_number: row.survey_number,
          sub_division_number: row.sub_division_number,
          official_owner: row.official_owner,
          official_area: row.official_area,
          land_classification: row.land_classification,
          record_status: row.record_status,
          land_area_sqm: parseFloat(row.land_area_sqm) || 0,
          location_type: row.location_type,
          latitude: parseFloat(row.latitude) || 0,
          longitude: parseFloat(row.longitude) || 0,
          base_market_value: parseFloat(row.base_market_value) || 0,
          multiplier: parseFloat(row.multiplier) || 1,
          asset_value: parseFloat(row.asset_value) || 0,
          solatium_100_percent: parseFloat(row.solatium_100_percent) || 0,
          total_compensation: parseFloat(row.total_compensation) || 0,
          compensation_percentage: parseFloat(row.compensation_percentage) || 0,
          possession_percentage: parseFloat(row.possession_percentage) || 0,
          rr_percentage: parseFloat(row.rr_percentage) || 0,
          delayed: row.delayed === "1",
          delay_days: parseInt(row.delay_days) || 0,
        });
      })
      .on("end", () => {
        store.parcels = rows;
        saveStore();
        console.log(`Seeded ${rows.length} parcels from CSV.`);
        resolve();
      })
      .on("error", reject);
  });
}