// Single source of truth for department -> total semester count.
// Used by both Signup.jsx and ManageUsersSection.jsx so the two can never
// drift out of sync. Add new departments here only — nowhere else.
export const DEPARTMENT_SEMESTERS = {
  'BCS': 6,
  'B.Sc. Cybersecurity': 6,
  'BIBM': 8,
  'MBA': 2,
};

export const DEPARTMENTS = Object.keys(DEPARTMENT_SEMESTERS);

// Returns [1, 2, ..., n] for a given department, or [] if the department
// is unknown/unset.
export const getSemesterOptions = (department) => {
  const count = DEPARTMENT_SEMESTERS[department];
  if (!count) return [];
  return Array.from({ length: count }, (_, i) => i + 1);
};