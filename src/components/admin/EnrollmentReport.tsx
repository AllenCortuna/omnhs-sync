"use client"
import React, { useState, useEffect, useRef } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase'
import { getDefaultSchoolYear } from '@/config/school'
import { sectionService } from '@/services/sectionService'
import { strandService } from '@/services/strandService'
import type { Section, Strand } from '@/interface/info'
import type { Student } from '@/interface/user'
import { LoadingOverlay } from '@/components/common'
import { HiDocumentDownload, HiUserGroup, HiAcademicCap } from 'react-icons/hi'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface StudentWithSection extends Student {
  section?: Section
  strand?: Strand
  gradeLevel?: string
}

interface GroupedData {
  strandId: string
  strandName: string
  sections: {
    sectionId: string
    sectionName: string
    adviserName?: string
    adviserEmail?: string
    students: StudentWithSection[]
  }[]
}

const EnrollmentReport: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [groupedData, setGroupedData] = useState<GroupedData[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [currentSchoolYear, setCurrentSchoolYear] = useState('')
  const reportRef = useRef<HTMLDivElement>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  useEffect(() => {
    fetchEnrollmentData()
  }, [])

  async function fetchEnrollmentData() {
    try {
      setLoading(true)
      const schoolYear = getDefaultSchoolYear()
      setCurrentSchoolYear(schoolYear)

      // Fetch all enrolled students for current school year
      const studentsQuery = query(
        collection(db, 'students'),
        where('status', '==', 'enrolled'),
        where('enrolledForSchoolYear', '==', schoolYear),
        orderBy('lastName', 'asc')
      )
      const studentsSnapshot = await getDocs(studentsQuery)
      
      const students: StudentWithSection[] = []
      studentsSnapshot.forEach((doc) => {
        students.push({ id: doc.id, ...doc.data() } as StudentWithSection)
      })

      // Fetch enrollment records to get grade levels
      const enrollmentQuery = query(
        collection(db, 'enrollment'),
        where('status', '==', 'approved'),
        where('schoolYear', '==', schoolYear)
      )
      const enrollmentSnapshot = await getDocs(enrollmentQuery)
      const enrollmentMap = new Map<string, string>()
      enrollmentSnapshot.forEach((doc) => {
        const enrollment = doc.data()
        enrollmentMap.set(enrollment.studentId, enrollment.gradeLevel)
      })

      // Fetch all sections
      const sections = await sectionService.getAllSections()
      
      // Fetch all strands
      const strands = await strandService.getAllStrands()

      // Create maps for quick lookup
      const sectionMap = new Map<string, Section>()
      sections.forEach(section => {
        sectionMap.set(section.id, section)
      })

      const strandMap = new Map<string, Strand>()
      strands.forEach(strand => {
        strandMap.set(strand.id, strand)
      })

      // Enrich students with section, strand, and grade level data
      const enrichedStudents = students.map(student => {
        const section = student.enrolledForSectionId 
          ? sectionMap.get(student.enrolledForSectionId)
          : undefined
        const strand = section?.strandId 
          ? strandMap.get(section.strandId)
          : undefined
        const gradeLevel = enrollmentMap.get(student.studentId)

        return {
          ...student,
          section,
          strand,
          gradeLevel
        }
      })

      // Group by strand and section
      const grouped = new Map<string, {
        strandId: string
        strandName: string
        sections: Map<string, {
          sectionId: string
          sectionName: string
          adviserName?: string
          adviserEmail?: string
          students: StudentWithSection[]
        }>
      }>()

      enrichedStudents.forEach(student => {
        if (!student.strand || !student.section) return

        const strandId = student.strand.id
        const sectionId = student.section.id

        if (!grouped.has(strandId)) {
          grouped.set(strandId, {
            strandId,
            strandName: student.strand.strandName,
            sections: new Map()
          })
        }

        const strandGroup = grouped.get(strandId)!
        
        if (!strandGroup.sections.has(sectionId)) {
          strandGroup.sections.set(sectionId, {
            sectionId,
            sectionName: student.section.sectionName,
            adviserName: student.section.adviserName,
            adviserEmail: student.section.adviserEmail,
            students: []
          })
        }

        const sectionGroup = strandGroup.sections.get(sectionId)!
        sectionGroup.students.push(student)
      })

      // Convert to array format and sort
      const groupedArray: GroupedData[] = Array.from(grouped.values())
        .map(group => ({
          strandId: group.strandId,
          strandName: group.strandName,
          sections: Array.from(group.sections.values())
            .map(section => ({
              ...section,
              students: section.students.sort((a, b) => {
                const aName = `${a.lastName || ''}, ${a.firstName || ''}`.toLowerCase()
                const bName = `${b.lastName || ''}, ${b.firstName || ''}`.toLowerCase()
                return aName.localeCompare(bName)
              })
            }))
            .sort((a, b) => a.sectionName.localeCompare(b.sectionName))
        }))
        .sort((a, b) => a.strandName.localeCompare(b.strandName))

      setGroupedData(groupedArray)
      setTotalStudents(students.length)
    } catch (error) {
      console.error('Error fetching enrollment data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function exportToPDF() {
    if (!reportRef.current) return

    try {
      setGeneratingPDF(true)
      
      // Get the report element
      const element = reportRef.current
      
      // Create canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      
      // Calculate PDF dimensions
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      let position = 0

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Save PDF
      const fileName = `Enrollment_Report_${currentSchoolYear}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (loading) {
    return <LoadingOverlay />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <HiUserGroup className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold martian-mono text-primary">
              Enrollment Report
            </h2>
            <p className="text-xs text-gray-500 italic">
              School Year: {currentSchoolYear}
            </p>
          </div>
        </div>
        <button
          onClick={exportToPDF}
          disabled={generatingPDF || groupedData.length === 0}
          className="btn btn-primary btn-sm gap-2 text-white martian-mono"
        >
          {generatingPDF ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Generating...
            </>
          ) : (
            <>
              <HiDocumentDownload className="w-4 h-4" />
              Export PDF
            </>
          )}
        </button>
      </div>

      {/* Summary Card */}
      <div className="card bg-white shadow-md">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary martian-mono">
                {totalStudents}
              </div>
              <div className="text-xs text-gray-600 italic">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary martian-mono">
                {groupedData.length}
              </div>
              <div className="text-xs text-gray-600 italic">Strands</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary martian-mono">
                {groupedData.reduce((sum, group) => sum + group.sections.length, 0)}
              </div>
              <div className="text-xs text-gray-600 italic">Sections</div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content - This will be exported to PDF */}
      <div ref={reportRef} className="bg-white p-6 rounded-lg shadow-md">
        {/* Report Header */}
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold martian-mono text-primary mb-2">
            Enrollment Report
          </h1>
          <p className="text-sm text-gray-600">
            School Year: {currentSchoolYear}
          </p>
          <p className="text-xs text-gray-500 italic mt-1">
            Generated on {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {groupedData.length === 0 ? (
          <div className="text-center py-12">
            <HiAcademicCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 italic">
              No enrolled students found for the current school year.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedData.map((strandGroup) => (
              <div key={strandGroup.strandId} className="mb-6">
                {/* Strand Header */}
                <div className="bg-primary/10 p-3 rounded-t-lg border-b-2 border-primary">
                  <h2 className="text-lg font-bold martian-mono text-primary">
                    {strandGroup.strandName}
                  </h2>
                  <p className="text-xs text-gray-600 italic">
                    {strandGroup.sections.reduce((sum, sec) => sum + sec.students.length, 0)} students across {strandGroup.sections.length} section{strandGroup.sections.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Sections */}
                {strandGroup.sections.map((section) => (
                  <div key={section.sectionId} className="mb-4 border border-gray-200 rounded-b-lg overflow-hidden">
                    {/* Section Header */}
                    <div className="bg-gray-50 p-3 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-semibold martian-mono text-primary">
                            {section.sectionName}
                          </h3>
                          {section.adviserName && (
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">Adviser:</span> {section.adviserName}
                              {section.adviserEmail && (
                                <span className="text-gray-500"> ({section.adviserEmail})</span>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-primary martian-mono">
                            {section.students.length}
                          </div>
                          <div className="text-xs text-gray-500 italic">students</div>
                        </div>
                      </div>
                    </div>

                    {/* Students Table */}
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full text-xs">
                        <thead>
                          <tr className="bg-base-200">
                            <th className="text-xs font-bold martian-mono text-primary w-12">#</th>
                            <th className="text-xs font-bold martian-mono text-primary">Student ID</th>
                            <th className="text-xs font-bold martian-mono text-primary">Name</th>
                            <th className="text-xs font-bold martian-mono text-primary">Grade Level</th>
                            <th className="text-xs font-bold martian-mono text-primary">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.students.map((student, index) => (
                            <tr key={student.id}>
                              <td className="text-xs">{index + 1}</td>
                              <td className="text-xs font-mono">{student.studentId}</td>
                              <td className="text-xs">
                                {student.lastName || ''}, {student.firstName || ''} {student.middleName || ''} {student.suffix || ''}
                              </td>
                              <td className="text-xs">{student.gradeLevel || 'N/A'}</td>
                              <td className="text-xs">{student.email || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Report Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500 italic">
          <p>Total Students Enrolled: {totalStudents}</p>
          <p className="mt-1">
            Report generated by OM NHS Sync System
          </p>
        </div>
      </div>
    </div>
  )
}

export default EnrollmentReport
