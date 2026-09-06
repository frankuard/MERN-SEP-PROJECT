// Derives a student's "Level" from their department + semester, and
// provides the cohort group options they pick from within that level.
// Single source of truth — used by Signup, ManageUsersSection, and
// ProfileSection so all three stay in sync.
//
// Level mapping (confirmed rules):
//   BCS / B.Sc. Cybersecurity (3-year, 6 semesters):
//     Sem 1-2 -> Level 4, Sem 3-4 -> Level 5, Sem 5-6 -> Level 6
//   BIBM (4-year, 8 semesters):
//     Sem 1-2 -> Level 3, Sem 3-4 -> Level 4, Sem 5-6 -> Level 5, Sem 7-8 -> Level 6
//   MBA (2 semesters, post-bachelor's):
//     Sem 1 -> Level 7, Sem 2 -> Level 8

import { DEPARTMENT_SEMESTERS } from './departmentSemesters';

// Starting level for semester 1-2 of each department. Every department
// (except MBA, handled separately below) climbs one level per 2 semesters.
const BASE_LEVEL_BY_DEPARTMENT = {
  'BCS': 4,
  'B.Sc. Cybersecurity': 4,
  'BIBM': 3,
};

// Returns the numeric level for a given department + semester, or null if
// either is missing/unrecognized (e.g. a custom department with no known
// level scheme — those don't get a Level/Group at all).
export const getLevelForSemester = (department, semester) => {
  const sem = Number(semester);
  if (!department || !sem || Number.isNaN(sem)) return null;

  if (department === 'MBA') {
    // MBA is a flat mapping, not a "every 2 semesters" climb.
    if (sem === 1) return 7;
    if (sem === 2) return 8;
    return null;
  }

  const base = BASE_LEVEL_BY_DEPARTMENT[department];
  if (!base) return null; // unknown/custom department

  const totalSemesters = DEPARTMENT_SEMESTERS[department];
  if (totalSemesters && sem > totalSemesters) return null;

  // Semesters 1-2 -> base, 3-4 -> base+1, 5-6 -> base+2, etc.
  return base + Math.floor((sem - 1) / 2);
};

// How many cohort groups exist at a given level. Not currently known to
// vary by level/department, so this is a flat count for now — bump this
// (or turn it into a per-level map) if the college later needs different
// group counts per level.
const DEFAULT_COHORT_GROUP_COUNT = 6;

export const getCohortGroupOptions = (level) => {
  if (!level) return [];
  return Array.from({ length: DEFAULT_COHORT_GROUP_COUNT }, (_, i) => i + 1);
};

// Builds the short code shown/stored, e.g. "L4CG3".
export const buildGroupCode = (level, cohortGroup) => {
  if (!level || !cohortGroup) return '';
  return `L${level}CG${cohortGroup}`;
};

// Builds a friendlier descriptive label, e.g. "Level 4 · Cohort Group 3".
export const buildGroupLabel = (level, cohortGroup) => {
  if (!level || !cohortGroup) return '';
  return `Level ${level} · Cohort Group ${cohortGroup}`;
};

// Parses a stored code like "L4CG3" back into { level: 4, cohortGroup: 3 }.
// Returns null if it doesn't match the expected shape (e.g. legacy/blank
// values from before this feature existed).
export const parseGroupCode = (code) => {
  if (!code) return null;
  const match = /^L(\d+)CG(\d+)$/i.exec(code.trim());
  if (!match) return null;
  return { level: Number(match[1]), cohortGroup: Number(match[2]) };
};