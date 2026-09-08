// server/utils/normalizeName.js
//
// Strips honorific titles and normalizes case/whitespace so that
// "Mr. Bhisma Raj Koirala" (timetable JSON) and "bhisma raj koirala"
// (a username) are recognized as the same person.

const TITLE_REGEX = /^(mr|mrs|ms|miss|dr|er|eng|prof|professor)\.?\s+/i;

const normalizeName = (name = '') => {
  return name
    .toString()
    .trim()
    .replace(TITLE_REGEX, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

const Timetable = require('../models/Timetable');

const isKnownTeacherName = async (username) => {
  const key = normalizeName(username || '');
  if (!key) return false;
  const distinctLecturers = await Timetable.distinct('lecturer');
  return distinctLecturers.some((l) => normalizeName(l) === key);
};

module.exports = { normalizeName, isKnownTeacherName };