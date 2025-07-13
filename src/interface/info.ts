export interface Strand {
    id: string;
    strandName: string;
    strandDescription: string;
}

export interface Section {
    id: string;
    sectionName: string;
    strandId: string; // reference to the strand
}

export interface Subject {
    id: string;
    subjectName: string;
    subjectDescription: string;
    strandId: string; // reference to the strand
    quarter: string;
}

export interface StudentData {
    id: string;
    studentId: string; // reference to the student
    studentName: string; // reference to the data record
    firstQuarterGrade: number;
    secondQuarterGrade: number;
    finalGrade: number;
    remarks: string;
}

// SubjectRecord is a record of a subject's data for a specific section, quarter, school year, and term
export interface SubjectRecord{
    id: string;
    sectionId: string; // reference to the section
    sectionName: string; // reference to the section
    subjectId: string; // reference to the subject
    subjectName: string; // reference to the subject
    quarter: string;
    schoolYear: string;
    teacherId: string; // reference to the teacher
    teacherName: string; // reference to the teacher
    createdAt: string;
    studentData: StudentData[];
}


