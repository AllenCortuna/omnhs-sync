"use client";
import React, { useState } from 'react'
import StudentsCalendarPage from '../student-calendar/page';
import TeachersCalendarPage from '../teacher-calendar/page';

const CalendarPage = () => {
  const [page, setPage] = useState("student");
  
  return (
    <div>
      <div>
        <div className="flex justify-center items-center">
          <button className={`btn rounded-none ${page === "student" ? "btn-primary" : "btn-outline text-primary"}`} onClick={() => setPage("student")}>School Calendar</button>
          <button className={`btn rounded-none ${page === "teacher" ? "btn-primary" : "btn-outline text-primary"}`} onClick={() => setPage("teacher")}>Teachers Calendar</button>
        </div>
      </div>

      {page === "student" && (
        <StudentsCalendarPage />
      )}
      
      {page === "teacher" && (
        <TeachersCalendarPage />
      )}
    </div>
  );
};

export default CalendarPage;