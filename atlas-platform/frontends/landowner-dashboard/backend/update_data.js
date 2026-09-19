import db from "./database.js";

// Update all parcels to have 75% compensation disbursed
db.prepare(`
  UPDATE parcels
  SET compensation_percentage = 75
`).run();

// Or update a specific parcel's compensation values
db.prepare(`
  UPDATE parcels
  SET 
    total_compensation = 25000000,
    compensation_percentage = 100
  WHERE parcel_uuid = 'UP-LKO-2026-10000'
`).run();

console.log("Database successfully updated!");