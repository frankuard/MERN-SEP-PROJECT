// server/scripts/seedTimetableFromJson.js
//
// Wipes the Timetable collection and rebuilds it from level4.json / level5.json,
// creating (or reusing) the matching Module, Group, and Classroom documents so
// everything stays properly linked instead of being free-text.
//
// Usage (from the server/ directory):
//   node scripts/seedTimetableFromJson.js
//
// Requires: server/scripts/data/level4.json and server/scripts/data/level5.json
// (the two JSON arrays you already have).

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);


require('dotenv').config();
const mongoose = require('mongoose');

const Timetable = require('../models/Timetable');
const Module = require('../models/Module');
const Group = require('../models/Group');
const Classroom = require('../models/Classroom');

const level4 = require('./data/level4.json');
const level5 = require('./data/level5.json');

// JSON uses short day codes ("SUN", "MON"...) — the schema enum wants full names.
const DAY_MAP = {
  SUN: 'Sunday',
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

// Classrooms aren't given a capacity in the JSON — adjust this default,
// or go edit each room's capacity afterwards in the admin "Classrooms" tab.
const DEFAULT_CLASSROOM_CAPACITY = 60;

// ---- small in-memory caches so we don't hit the DB for every repeated code/name ----
const moduleCache = new Map();
const groupCache = new Map();
const classroomCache = new Map();

async function findOrCreateModule(code, name) {
  const key = code.trim();
  if (moduleCache.has(key)) return moduleCache.get(key);
  let doc = await Module.findOne({ code: key });
  if (!doc) doc = await Module.create({ code: key, name: name.trim() });
  moduleCache.set(key, doc);
  return doc;
}

async function findOrCreateGroup(name) {
  const key = name.trim();
  if (groupCache.has(key)) return groupCache.get(key);
  let doc = await Group.findOne({ name: key });
  if (!doc) doc = await Group.create({ name: key });
  groupCache.set(key, doc);
  return doc;
}

async function findOrCreateClassroom(name) {
  const key = name.trim();
  if (classroomCache.has(key)) return classroomCache.get(key);
  let doc = await Classroom.findOne({ name: key });
  if (!doc) doc = await Classroom.create({ name: key, capacity: DEFAULT_CLASSROOM_CAPACITY });
  classroomCache.set(key, doc);
  return doc;
}

async function importEntries(entries, label) {
  let created = 0;
  for (const raw of entries) {
    const day = DAY_MAP[raw.day] || raw.day;

    const moduleDoc = await findOrCreateModule(raw.moduleCode, raw.moduleTitle);
    const roomDoc = await findOrCreateClassroom(raw.room);

    const groupNames = (raw.group || '')
      .split('+')
      .map((g) => g.trim())
      .filter(Boolean);

    const groupDocs = [];
    for (const gName of groupNames) {
      groupDocs.push(await findOrCreateGroup(gName));
    }

    await Timetable.create({
      day,
      startTime: raw.startTime.trim(),
      endTime: raw.endTime.trim(),
      classType: raw.classType,
      module: moduleDoc._id,
      moduleCode: moduleDoc.code,
      moduleName: moduleDoc.name,
      lecturer: raw.lecturer.trim(),
      groups: groupDocs.map((g) => g._id),
      groupNames: groupDocs.map((g) => g.name),
      room: roomDoc._id,
      roomName: roomDoc.name,
      order: 0,
    });

    created += 1;
  }
  console.log(`${label}: created ${created} periods`);
}

async function run() {
  // NOTE: adjust the env var name if config/db.js uses a different one
  // (e.g. MONGODB_URI instead of MONGO_URI).
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('No Mongo connection string found in .env (checked MONGO_URI and MONGODB_URI)');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const existing = await Timetable.countDocuments();
  if (existing > 0) {
    console.log(`Found ${existing} existing Timetable document(s) — deleting before reseed...`);
    await Timetable.deleteMany({});
  }

  await importEntries(level4, 'Level 4');
  await importEntries(level5, 'Level 5');

  console.log('Done.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});