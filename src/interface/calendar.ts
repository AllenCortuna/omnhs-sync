export interface CalendarEvent {
    id: string;
    title: string;
    fromTeacher?: string;
    createdBy?: string;
    description?: string;
    startDate: string;
    endDate: string;
    recipient: string;
    subjectRecordIds?: string[];
}