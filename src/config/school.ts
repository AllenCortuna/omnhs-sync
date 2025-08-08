export function getSchoolYearOptions(): { value: string; label: string }[] {
    const now = new Date();
    const thisYear = now.getFullYear();
    const lastYear = thisYear - 1;
    return [
      { value: `${lastYear}-${thisYear}`, label: `${lastYear}-${thisYear}` },
      { value: `${thisYear}-${thisYear + 1}`, label: `${thisYear}-${thisYear + 1}` },
    ];
  }

  export const SEMESTER_OPTIONS = [
    { value: "1st", label: "1st Semester" },
    { value: "2nd", label: "2nd Semester" },
  ];