"use client"
import React from 'react'
import { TeacherSettings } from '../../../components/teacher'
import { useUserDataStore } from '../../../store/userDataStore'

const TeacherSettingsPage = () => {
  const { teacherData } = useUserDataStore()
  console.log('teacherData', teacherData)
  
  return (
    <TeacherSettings 
      teacherId={teacherData?.employeeId}
    />
  )
}

export default TeacherSettingsPage
