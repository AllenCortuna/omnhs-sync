export function getSchoolYearOptions(): { value: string; label: string }[] {
    const now = new Date();
    const thisYear = now.getFullYear();
    const lastYear = thisYear - 1;
    return [
      { value: `${lastYear}-${thisYear}`, label: `${lastYear}-${thisYear}` },
      { value: `${thisYear}-${thisYear + 1}`, label: `${thisYear}-${thisYear + 1}` },
    ];
  }

/**
 * Gets the default school year based on current date
 * - January to March: uses (lastYear-currentYear) format
 * - May to September: uses (currentYear-nextYear) format
 * - April, October-December: defaults to (currentYear-nextYear)
 */
export function getDefaultSchoolYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1 for 1-12
  
  // January (1) to March (3): use lastYear-currentYear
  if (month >= 1 && month <= 3) {
    const lastYear = currentYear - 1;
    return `${lastYear}-${currentYear}`;
  }
  
  // May (5) to September (9): use currentYear-nextYear
  if (month >= 5 && month <= 9) {
    const nextYear = currentYear + 1;
    return `${currentYear}-${nextYear}`;
  }
  
  // April, October-December: default to currentYear-nextYear
  const nextYear = currentYear + 1;
  return `${currentYear}-${nextYear}`;
}

  export const SEMESTER_OPTIONS = [
    { value: "1st", label: "1st Semester" },
    { value: "2nd", label: "2nd Semester" },
  ];