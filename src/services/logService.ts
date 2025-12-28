import { useLogsStore } from '../store/useLogStore';

interface LogData {
  studentId: string;
  name: string;
  createdBy?: string;
  description: string;
  logsBy: string;
}

class LogService {
  private addLog = useLogsStore.getState().addLog;

  // Generic method to add logs
  private async createLog(data: LogData): Promise<void> {
    try {
      await this.addLog({
        ...data,
        date: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating log:', error);
    }
  }


  // Strand-related logs
  async logStrandCreated(strandName: string, adminName: string): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Strand Created',
      description: `Strand "${strandName}" was created`,
      logsBy: adminName,
      createdBy: adminName,
    });
  }

  async logStrandUpdated(strandName: string, adminName: string): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Strand Updated',
      description: `Strand "${strandName}" was updated`,
      logsBy: adminName,
      createdBy: adminName,
    });
  }

  async logStrandDeleted(strandName: string, adminName: string): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Strand Deleted',
      description: `Strand "${strandName}" was deleted`,
      logsBy: adminName,
      createdBy: adminName,
    });
  }

  // Student grade-related logs
  async logGradeUpdated(
    studentId: string,
    studentName: string,
    subjectName: string,
    grade: number,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Grade Updated',
      description: `Grade for ${studentName} in ${subjectName} was updated to ${grade}`,
      logsBy: performedBy,
      createdBy: createdBy,
    });
  }

  async logGradeAdded(
    studentId: string,
    studentName: string,
    subjectName: string,
    grade: number,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Grade Added',
      description: `Grade for ${studentName} in ${subjectName} was added: ${grade}`,
      logsBy: performedBy,
      createdBy: createdBy,
    });
  }

  // Student enrollment logs
  async logEnrollmentApproved(
    studentId: string,
    studentName: string,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Enrollment Approved',
      description: `Enrollment for ${studentName} was approved`,
      logsBy: performedBy,
      createdBy: performedBy,
    });
  }

  async logEnrollmentRejected(
    studentId: string,
    studentName: string,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Enrollment Rejected',
      description: `Enrollment for ${studentName} was rejected`,
      logsBy: performedBy,
      createdBy: performedBy,
    });
  }

  // Student management logs
  async logStudentAdded(
    studentId: string,
    studentName: string,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Student Added',
      description: `Student ${studentName} was added to the system`,
      logsBy: performedBy,
      createdBy: performedBy,
    });
  }

  async logStudentUpdated(
    studentId: string,
    studentName: string,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Student Updated',
      description: `Student ${studentName} information was updated`,
      logsBy: performedBy,
      createdBy: performedBy,
    });
  }

  async logStudentDeleted(
    studentId: string,
    studentName: string,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Student Deleted',
      description: `Student ${studentName} was deleted from the system`,
      logsBy: performedBy,
      createdBy: createdBy,
    });
  }

  async logStudentApproved(
    studentId: string,
    studentName: string,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Student Approved',
      description: `Student ${studentName} account was approved`,
      logsBy: performedBy,
      createdBy: performedBy,
    });
  }

  // Teacher management logs
  async logTeacherAdded(
    teacherName: string,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Teacher Added',
      description: `Teacher ${teacherName} was added to the system`,
      logsBy: performedBy,
      createdBy: createdBy,
    });
  }

  async logTeacherUpdated(
    teacherName: string,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Teacher Updated',
      description: `Teacher ${teacherName} information was updated`,
      logsBy: performedBy,
      createdBy: createdBy,
    });
  }

  async logTeacherDeleted(
    teacherId: string,
    teacherName: string,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Teacher Deleted',
      description: `Teacher ${teacherName} was deleted from the system`,
      logsBy: performedBy,
      createdBy: createdBy,
    });
  }

  // Section logs
  async logSectionCreated(
    sectionName: string,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Section Created',
      description: `Section "${sectionName}" was created`,
      logsBy: performedBy,
      createdBy: createdBy,
    });
  }

  async logSectionUpdated(
    sectionId: string,
    sectionName: string,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Section Updated',
      description: `Section "${sectionName}" information was updated`,
      logsBy: performedBy,
      createdBy: createdBy,
      });
  }

  async logSectionDeleted(
    sectionId: string,
    sectionName: string,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Section Deleted',
      description: `Section "${sectionName}" was deleted from the system`,
      logsBy: performedBy,
      createdBy: createdBy,
    });
  }

  async logTeacherAssignedToSection(
    sectionId: string,
    sectionName: string,
    teacherId: string,
    teacherName: string,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Teacher Assigned to Section',
      description: `Teacher ${teacherName} was assigned to section "${sectionName}"`,
      logsBy: performedBy,
      createdBy: createdBy
    });
  }

  async logTeacherRemovedFromSection(
    sectionId: string,
    sectionName: string,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Teacher Removed from Section',
      description: `Teacher was removed from section "${sectionName}"`,
      logsBy: performedBy,
      createdBy: createdBy
    });
  }

  // Subject logs
  async logSubjectCreated(
    subjectName: string,
    adminName: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Subject Created',
      description: `Subject "${subjectName}" was created`,
      logsBy: adminName,
      createdBy: adminName,
    });
  }

  async logSubjectUpdated(
    subjectName: string,
    adminName: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Subject Updated',
      description: `Subject "${subjectName}" was updated`,
      logsBy: adminName,
      createdBy: adminName,
    });
  }

  async logSubjectDeleted(
    subjectName: string,
    adminName: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Subject Deleted',
      description: `Subject "${subjectName}" was deleted`,
      logsBy: adminName,
      createdBy: adminName,
    });
  }

  // System logs
  async logSystemAction(
    action: string,
    description: string,
    performedBy: string,
    createdBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: action,
      description,
      logsBy: performedBy,
      createdBy: createdBy,
    });
  }
}

export const logService = new LogService();
