import { useLogsStore } from '../store/useLogStore';

interface LogData {
  studentId: string;
  name: string;
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

  // Section-related logs
  async logSectionCreated(sectionName: string, adminName: string): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Section Created',
      description: `Section "${sectionName}" was created`,
      logsBy: adminName,
    });
  }

  async logSectionUpdated(sectionName: string, adminName: string): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Section Updated',
      description: `Section "${sectionName}" was updated`,
      logsBy: adminName,
    });
  }

  async logSectionDeleted(sectionName: string, adminName: string): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Section Deleted',
      description: `Section "${sectionName}" was deleted`,
      logsBy: adminName,
    });
  }

  // Strand-related logs
  async logStrandCreated(strandName: string, adminName: string): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Strand Created',
      description: `Strand "${strandName}" was created`,
      logsBy: adminName,
    });
  }

  async logStrandUpdated(strandName: string, adminName: string): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Strand Updated',
      description: `Strand "${strandName}" was updated`,
      logsBy: adminName,
    });
  }

  async logStrandDeleted(strandName: string, adminName: string): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Strand Deleted',
      description: `Strand "${strandName}" was deleted`,
      logsBy: adminName,
    });
  }

  // Student grade-related logs
  async logGradeUpdated(
    studentId: string,
    studentName: string,
    subjectName: string,
    grade: number,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Grade Updated',
      description: `Grade for ${studentName} in ${subjectName} was updated to ${grade}`,
      logsBy: performedBy,
    });
  }

  async logGradeAdded(
    studentId: string,
    studentName: string,
    subjectName: string,
    grade: number,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Grade Added',
      description: `Grade for ${studentName} in ${subjectName} was added: ${grade}`,
      logsBy: performedBy,
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
    });
  }

  async logStudentDeleted(
    studentId: string,
    studentName: string,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId,
      name: 'Student Deleted',
      description: `Student ${studentName} was deleted from the system`,
      logsBy: performedBy,
    });
  }

  // Teacher management logs
  async logTeacherAdded(
    teacherId: string,
    teacherName: string,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Teacher Added',
      description: `Teacher ${teacherName} was added to the system`,
      logsBy: performedBy,
    });
  }

  async logTeacherUpdated(
    teacherId: string,
    teacherName: string,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Teacher Updated',
      description: `Teacher ${teacherName} information was updated`,
      logsBy: performedBy,
    });
  }

  async logTeacherDeleted(
    teacherId: string,
    teacherName: string,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: 'Teacher Deleted',
      description: `Teacher ${teacherName} was deleted from the system`,
      logsBy: performedBy,
    });
  }

  // System logs
  async logSystemAction(
    action: string,
    description: string,
    performedBy: string
  ): Promise<void> {
    await this.createLog({
      studentId: 'SYSTEM',
      name: action,
      description,
      logsBy: performedBy,
    });
  }
}

export const logService = new LogService();
