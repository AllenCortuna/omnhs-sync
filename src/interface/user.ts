export interface Admin {
    email: string;
    userId: string;
    firstName: string;
    lastName: string;
    contactNumber: string;
    address: string;
}

export interface Teacher {
    employeeId: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    createdAt: string;
    lastLoginAt: string;
    profileRef: string; // reference to the teacher's profile in storage
    contactNumber?: string;
    address?: string;
    designatedSectionId?: string; // reference to the teacher's designated section
}

export interface Student {
    id?: string;
    studentId: string;
    email?: string;
    createdAt: string;
    lastLoginAt?: string;
    profileRef?: string; // reference to the student's profile in storage
    profileChangeDate?: string;
    contactNumber?: string;
    address?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    suffix?: string;
    sex: string;
    birthDate?: string;
    birthPlace?: string;
    civilStatus?: string;
    nationality?: string;
    religion?: string;
    motherTongue?: string;
    fatherName?: string;
    fatherOccupation?: string;
    fatherContactNumber?: string;
    motherName?: string;
    motherOccupation?: string;
    motherContactNumber?: string;
    guardianName?: string;
    guardianOccupation?: string;
    guardianContactNumber?: string;
    profileComplete?: boolean;
    updatedAt?: string;
}