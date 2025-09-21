export interface Strand {
    id: string;
    strandName: string;
    strandDescription: string;
}

export interface Section {
    id: string;
    sectionName: string;
    strandId: string; // reference to the strand
    adviserId?: string; // reference to the teacher
    adviserName?: string; // reference to the teacher name
    adviserEmail?: string; // reference to the teacher email
    createdAt?: string;
    updatedAt?: string;
}

export interface Subject {
    id: string;
    subjectName: string;
    subjectDescription: string;
    strandId: string; // reference to the strand
    quarter: string;
}

export interface StudentGrade {
    id: string;
    studentId: string; // reference to the student
    studentName: string; // reference to the data record
    firstQuarterGrade: number;
    secondQuarterGrade: number;
    finalGrade: number;
    rating?: string;
    remarks: string;
    subjectRecordId: string; // reference to the subject record
    subjectName: string; // reference to the subject
    gradeLevel: string; // reference to the grade level
    semester: string;
    schoolYear: string;
    teacherId: string; // reference to the teacher
    teacherName: string; // reference to the teacher
    createdAt: string;
}

// SubjectRecord is a record of a subject's data for a specific section, semester, school year, and term
export interface SubjectRecord{
    id: string;
    sectionId: string; // reference to the section
    sectionName: string; // reference to the section
    subjectId: string; // reference to the subject
    subjectName: string; // reference to the subject
    gradeLevel: string; // reference to the grade level
    semester: string;
    schoolYear: string;
    teacherId: string; // reference to the teacher
    teacherName: string; // reference to the teacher
    createdAt: string;
    studentGrades: StudentGrade[];
    studentList: string[];
}

export interface Enrollment {
    id: string;
    studentId: string; // reference to the student
    gradeLevel: string; // reference to the grade level
    strandId: string; // reference to the strand
    semester: string; // reference to the semester
    schoolYear: string; // reference to the school year
    studentName: string; // reference to the student
    clearance?: string; // firebase storage url
    copyOfGrades?: string; // firebase storage url
    isPWD?: boolean;
    status?: string; // pending, approved, rejected
    sectionId?: string; // reference to the section

    returningStudent?: boolean;
    lastGradeLevel?: string;
    lastSchoolAttended?: string;
    lastSchoolYear?: string;

    createdAt: string;
    updatedAt: string;
}


