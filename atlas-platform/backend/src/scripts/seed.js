/**
 * Seeds the database from the raw master CSV.
 *
 * Fixes applied to the source data (see the ATLAS data-audit notes):
 *  1. The CSV's `project_id` (P001..P009) spans all 4 states — that's
 *     not a usable "project" for an assign-to-one-state workflow. We
 *     regroup rows by (state, district, project_type) instead, so
 *     every generated project belongs to exactly one state.
 *  2. parcel_uuid is regenerated from the row's OWN state/district so
 *     it can't disagree with its own coordinates (the source data has
 *     e.g. a "UP-LKO-..." id tagged state="Tamil Nadu").
 *  3. Adds the tables the CSV never had at all: users (with real
 *     logins), compensation installments, and a representative
 *     dispute per project where the source counts indicate one.
 *  4. Seeds one project_assignments row per project so the
 *     Central -> State workflow has a real starting point instead of
 *     an empty audit trail.
 *
 * Run: npm run db:seed   (after npm run db:init)
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");

const CSV_PATH = path.join(__dirname, "..", "..", "data", "raw", "fully_synced_master_dataset.csv");

const STATE_CODE = {
  "Tamil Nadu": "TN",
  "Uttar Pradesh": "UP",
  "Bihar": "BR",
  "Maharashtra": "MH",
};

function districtCode(district) {
  return district.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

function parseIndianDate(str) {
  // "26-04-2025" -> "2025-04-26"
  if (!str) return null;
  const [d, m, y] = str.split("-");
  if (!d || !m || !y) return null;
  return `${y}-${m}-${d}`;
}

function slugIdentity(name, suffix) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")}.${suffix}@atlas.gov.in`;
}

const DEMO_PASSWORD_HASH = bcrypt.hashSync("Passw0rd!", 10);

// Central-review statuses first (0-25% complete), then progressively
// further along the pipeline as compensation/possession % rises.
function deriveStatus(avgCompPct, avgPossPct) {
  if (avgPossPct >= 95) return "completed";
  if (avgPossPct >= 60) return "possession";
  if (avgCompPct >= 40) return "compensation_in_progress";
  if (avgCompPct > 0) return "district_verified";
  if (avgCompPct === 0) return "pending_district_verification";
  return "pending_state_review";
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found at ${CSV_PATH}. Copy the master dataset there first.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true });
  console.log(`Loaded ${rows.length} raw parcel rows.`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Clearing existing data...");
    await client.query(`TRUNCATE notifications, project_assignments, compensation_installments,
      disputes, documents, field_visits, complaints, parcels, projects, users RESTART IDENTITY CASCADE`);

    // ---------------------------------------------------------
    // 1. USERS — central admin, one state/district authority per
    //    state/district, one survey officer per name, one landowner
    //    per name+state.
    // ---------------------------------------------------------
    const userIdByKey = new Map(); // key -> id

    async function upsertUser({ key, fullName, identity, role, state, district, village, phone }) {
      if (userIdByKey.has(key)) return userIdByKey.get(key);
      const { rows: [u] } = await client.query(
        `INSERT INTO users (full_name, identity, phone, password_hash, role, state, district, village, is_verified, approval_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,'approved')
         ON CONFLICT (identity) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id`,
        [fullName, identity, phone || null, DEMO_PASSWORD_HASH, role, state || null, district || null, village || null]
      );
      userIdByKey.set(key, u.id);
      return u.id;
    }

    const centralId = await upsertUser({
      key: "central",
      fullName: "Central Land Acquisition Cell",
      identity: "admin.central@atlas.gov.in",
      role: "central",
    });

    for (const state of Object.keys(STATE_CODE)) {
      await upsertUser({
        key: `state:${state}`,
        fullName: `${state} State Authority`,
        identity: slugIdentity(state, "state"),
        role: "state",
        state,
      });
    }

    const districtsSeen = new Set();
    for (const r of rows) {
      const dKey = `${r.state}|${r.district}`;
      if (districtsSeen.has(dKey)) continue;
      districtsSeen.add(dKey);
      await upsertUser({
        key: `district:${dKey}`,
        fullName: `${r.district} District Authority`,
        identity: slugIdentity(`${r.district}.${r.state}`, "district"),
        role: "district",
        state: r.state,
        district: r.district,
      });
    }

    for (const r of rows) {
      if (!r.survey_officer_name) continue;
      const key = `survey:${r.survey_officer_name}`;
      await upsertUser({
        key,
        fullName: r.survey_officer_name,
        identity: slugIdentity(r.survey_officer_name, "survey"),
        role: "survey",
        state: r.state,
        district: r.district,
        village: r.village,
      });
    }

    let landownerSeq = 1;
    for (const r of rows) {
      if (!r.landowner_name) continue;
      const key = `landowner:${r.landowner_name}|${r.state}`;
      if (userIdByKey.has(key)) continue;
      const loId = `LO-${STATE_CODE[r.state] || "XX"}-2026-${String(landownerSeq).padStart(5, "0")}`;
      landownerSeq += 1;
      await upsertUser({
        key,
        fullName: r.landowner_name,
        identity: loId.toLowerCase(),
        role: "landowner",
        state: r.state,
        district: r.district,
        village: r.village,
        phone: `+91 9${String(Math.floor(100000000 + Math.random() * 899999999))}`,
      });
    }

    console.log(`Seeded ${userIdByKey.size} users (1 central, ${Object.keys(STATE_CODE).length} state, ${districtsSeen.size} district, plus survey officers & landowners).`);

    // ---------------------------------------------------------
    // 2. PROJECTS — regrouped by (state, district, project_type)
    //    so every project belongs to exactly one state.
    // ---------------------------------------------------------
    const groups = new Map(); // groupKey -> rows[]
    for (const r of rows) {
      const key = `${r.state}|${r.district}|${r.project_type}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    let projectSeq = 1;
    const projectIdByGroupKey = new Map();

    for (const [groupKey, groupRows] of groups.entries()) {
      const [state, district, projectType] = groupKey.split("|");
      const code = `ATLAS-PRJ-${String(projectSeq).padStart(4, "0")}`;
      projectSeq += 1;

      const name = `${district} ${projectType} ${projectType === "Transmission" ? "Line" : "Corridor"} — ${state}`;
      const avgCompPct = avg(groupRows.map((r) => Number(r.compensation_percentage) || 0));
      const avgPossPct = avg(groupRows.map((r) => Number(r.possession_percentage) || 0));
      const totalCost = sum(groupRows.map((r) => Number(r.total_compensation) || 0)) / 1e7; // paise-ish -> Cr, just scaling for a plausible display number
      const totalLandHa = sum(groupRows.map((r) => Number(r.land_area_sqm) || 0)) / 10000;
      const anyDelayed = groupRows.some((r) => r.delayed === "1");
      const risk = anyDelayed ? (avgCompPct < 30 ? "High" : "Medium") : "Low";
      const status = deriveStatus(avgCompPct, avgPossPct);
      const issueDate = parseIndianDate(groupRows[0].project_issue_date);
      const deadlineDate = parseIndianDate(groupRows[0].project_deadline_date);

      const { rows: [project] } = await client.query(
        `INSERT INTO projects
          (code, name, project_type, description, state, districts, department, funding_source,
           nodal_officer, estimated_cost_cr, land_required_ha, risk, priority, status, proposed_by,
           issue_date, deadline_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING id`,
        [code, name, projectType, `${projectType} land acquisition in ${district}, ${state}.`,
         state, [district], "Ministry of Infrastructure (seed)", "Central Plan Outlay",
         "TBD", round2(totalCost), round2(totalLandHa), risk, "Medium", status, centralId,
         issueDate, deadlineDate]
      );
      projectIdByGroupKey.set(groupKey, project.id);

      // Seed a minimal, status-consistent assignment trail so the
      // workflow has real history instead of starting from nothing.
      await client.query(
        `INSERT INTO project_assignments (project_id, from_role, to_role, from_user, target_state, target_district, action, notes)
         VALUES ($1,'central','state',$2,$3,$4,'assigned','Seeded initial assignment')`,
        [project.id, centralId, state, district]
      );
      if (status !== "pending_state_review") {
        const stateUserId = userIdByKey.get(`state:${state}`);
        await client.query(
          `INSERT INTO project_assignments (project_id, from_role, to_role, to_user, target_state, target_district, action, notes)
           VALUES ($1,'state','state',$2,$3,$4,'accepted','Seeded acceptance')`,
          [project.id, stateUserId, state, district]
        );
      }
    }
    console.log(`Seeded ${projectIdByGroupKey.size} projects (regrouped by state+district+type).`);

    // ---------------------------------------------------------
    // 3. PARCELS + installments + disputes
    // ---------------------------------------------------------
    let parcelSeq = 1;
    let installmentCount = 0;
    let disputeCount = 0;

    for (const r of rows) {
      const groupKey = `${r.state}|${r.district}|${r.project_type}`;
      const projectId = projectIdByGroupKey.get(groupKey);
      const landownerId = userIdByKey.get(`landowner:${r.landowner_name}|${r.state}`) || null;
      const surveyOfficerId = userIdByKey.get(`survey:${r.survey_officer_name}`) || null;

      const newParcelUuid = `${STATE_CODE[r.state] || "XX"}-${districtCode(r.district)}-${String(parcelSeq).padStart(6, "0")}`;
      parcelSeq += 1;

      const lat = Number(r.latitude) || 0;
      const lng = Number(r.longitude) || 0;
      // Source data is Point-only; we keep Point geometry here but
      // flag it — see README for why real cadastral polygons should
      // replace this before this goes near production.
      const geometry = { type: "Point", coordinates: [lng, lat] };

      const totalComp = Number(r.total_compensation) || 0;
      const compPct = Number(r.compensation_percentage) || 0;
      const possPct = Number(r.possession_percentage) || 0;

      const { rows: [parcel] } = await client.query(
        `INSERT INTO parcels
          (parcel_uuid, project_id, state, district, village, survey_number, sub_division_number,
           landowner_id, official_owner, land_classification, record_status, land_area_sqm,
           location_type, geometry, base_market_value, multiplier, asset_value, solatium,
           total_compensation, compensation_percentage, possession_percentage, rr_percentage,
           delayed, delay_days, survey_officer_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
         RETURNING id`,
        [newParcelUuid, projectId, r.state, r.district, r.village, r.survey_number, r.sub_division_number,
         landownerId, r.official_owner, r.land_classification, r.record_status, Number(r.land_area_sqm) || 0,
         r.location_type, JSON.stringify(geometry), Number(r.base_market_value) || 0, Number(r.multiplier) || 1,
         Number(r.asset_value) || 0, Number(r.solatium_100_percent) || 0, totalComp, compPct, possPct,
         Number(r.rr_percentage) || 0, r.delayed === "1", Number(r.delay_days) || 0, surveyOfficerId]
      );

      // Installments derived from compensation_percentage.
      if (totalComp > 0) {
        if (compPct >= 100) {
          await client.query(
            `INSERT INTO compensation_installments (parcel_id, amount, due_date, paid_date, status, mode)
             VALUES ($1,$2,$3,$3,'Paid','DBT')`,
            [parcel.id, round2(totalComp), parseIndianDate(r.project_deadline_date) || null]
          );
          installmentCount += 1;
        } else if (compPct > 0) {
          const paidAmount = round2(totalComp * (compPct / 100));
          const pendingAmount = round2(totalComp - paidAmount);
          await client.query(
            `INSERT INTO compensation_installments (parcel_id, amount, due_date, paid_date, status, mode)
             VALUES ($1,$2,$3,$3,'Paid','DBT')`,
            [parcel.id, paidAmount, parseIndianDate(r.project_issue_date) || null]
          );
          await client.query(
            `INSERT INTO compensation_installments (parcel_id, amount, due_date, status, mode)
             VALUES ($1,$2,$3,'Pending','DBT')`,
            [parcel.id, pendingAmount, parseIndianDate(r.project_deadline_date) || null]
          );
          installmentCount += 2;
        } else {
          await client.query(
            `INSERT INTO compensation_installments (parcel_id, amount, due_date, status, mode)
             VALUES ($1,$2,$3,'Pending','DBT')`,
            [parcel.id, round2(totalComp), parseIndianDate(r.project_deadline_date) || null]
          );
          installmentCount += 1;
        }
      }

      // One representative dispute row per signal the CSV counted
      // (the CSV only had counts, e.g. boundary_disputes: 3 — we
      // can't reconstruct 3 distinct real disputes from a count, so
      // this seeds ONE row per signal type as a placeholder to build
      // real dispute-entry UI against, not a faithful reproduction).
      if (Number(r.boundary_disputes) > 0) {
        await client.query(
          `INSERT INTO disputes (parcel_id, raised_by, type, priority, escalated_to, status, description)
           VALUES ($1,$2,'Boundary Clash','Medium','Tehsil Revenue','Open',$3)`,
          [parcel.id, landownerId, `${r.boundary_disputes} boundary dispute(s) recorded in source data for survey ${r.survey_number}.`]
        );
        disputeCount += 1;
      }
      if (Number(r.ownership_disputes) > 0) {
        await client.query(
          `INSERT INTO disputes (parcel_id, raised_by, type, priority, escalated_to, status, description)
           VALUES ($1,$2,'Ownership Claim','Medium','SDM Office','Open',$3)`,
          [parcel.id, landownerId, `${r.ownership_disputes} ownership dispute(s) recorded in source data for survey ${r.survey_number}.`]
        );
        disputeCount += 1;
      }
      if (Number(r.legal_cases) > 0) {
        await client.query(
          `INSERT INTO disputes (parcel_id, raised_by, type, priority, escalated_to, status, description)
           VALUES ($1,$2,'Legal Case','High','District Court','Under Review',$3)`,
          [parcel.id, landownerId, `${r.legal_cases} legal case(s) recorded in source data for survey ${r.survey_number}.`]
        );
        disputeCount += 1;
      }
    }

    console.log(`Seeded ${parcelSeq - 1} parcels, ${installmentCount} compensation installments, ${disputeCount} disputes.`);

    await client.query("COMMIT");
    console.log("Seed complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed, rolled back:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

function avg(arr) { return arr.length ? sum(arr) / arr.length : 0; }
function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
function round2(n) { return Math.round(n * 100) / 100; }

main();
