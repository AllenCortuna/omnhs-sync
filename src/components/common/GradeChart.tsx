"use client"
import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { HiChartBar, HiChartPie, HiFilter } from 'react-icons/hi';
import { SubjectRecord } from '../../interface/info';
import { Student } from '../../interface/user';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface GradeChartProps {
  subjectRecords: SubjectRecord[];
  studentsByClass: { [key: string]: Student[] };
}

interface GradeData {
  gpaRange: string;
  male: number;
  female: number;
  total: number;
}

interface StudentGrade {
  studentId: string;
  studentName: string;
  sex: string;
  averageGrade: number;
}

const GradeChart: React.FC<GradeChartProps> = ({ subjectRecords, studentsByClass }) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('pie');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('all');
  const [gradeData, setGradeData] = useState<GradeData[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);

  // Get unique semesters and school years
  const semesters = useMemo(() => {
    const uniqueSemesters = Array.from(new Set(subjectRecords.map(record => record.semester)));
    return uniqueSemesters.sort();
  }, [subjectRecords]);

  const schoolYears = useMemo(() => {
    const uniqueYears = Array.from(new Set(subjectRecords.map(record => record.schoolYear)));
    return uniqueYears.sort();
  }, [subjectRecords]);


  // Fetch student grades when filters are selected
  useEffect(() => {
    const fetchStudentGrades = async () => {
      if (selectedSemester === 'all' || selectedSchoolYear === 'all') {
        setStudentGrades([]);
        setGradeData([]);
        return;
      }

      try {
        setLoading(true);
        
        // Get filtered records
        const filteredRecords = subjectRecords.filter(record => 
          record.semester === selectedSemester && record.schoolYear === selectedSchoolYear
        );

        if (filteredRecords.length === 0) {
          setStudentGrades([]);
          setGradeData([]);
          return;
        }

        // Fetch all student grades for the filtered records
        const studentGradeMap = new Map<string, { grades: number[], student: Student }>();
        
        for (const record of filteredRecords) {
          if (record.studentGrades && record.studentGrades.length > 0) {
            // Process each student grade in the record
            for (const studentGrade of record.studentGrades) {
              if (studentGrade.finalGrade && studentGrade.finalGrade >= 0) {
                // Find student details
                const students = studentsByClass[record.id] || [];
                const student = students.find(s => s.studentId === studentGrade.studentId);
                
                if (student) {
                  if (!studentGradeMap.has(studentGrade.studentId)) {
                    studentGradeMap.set(studentGrade.studentId, { grades: [], student });
                  }
                  studentGradeMap.get(studentGrade.studentId)!.grades.push(studentGrade.finalGrade);
                }
              }
            }
          }
        }

        // Calculate average grades per student
        const studentGradesData: StudentGrade[] = Array.from(studentGradeMap.entries()).map(([studentId, data]) => {
          const averageGrade = data.grades.reduce((sum, grade) => sum + grade, 0) / data.grades.length;
          return {
            studentId,
            studentName: `${data.student.lastName}, ${data.student.firstName}`,
            sex: data.student.sex,
            averageGrade: Math.round(averageGrade * 100) / 100 // Round to 2 decimal places
          };
        });

        setStudentGrades(studentGradesData);
      } catch (error) {
        console.error('Error fetching student grades:', error);
        setStudentGrades([]);
        setGradeData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentGrades();
  }, [selectedSemester, selectedSchoolYear, subjectRecords, studentsByClass]);

  // Process grade data for chart
  useEffect(() => {
    if (studentGrades.length === 0) {
      setGradeData([]);
      return;
    }

    const gpaRanges = [
      { range: '75-79', min: 75, max: 79 },
      { range: '80-84', min: 80, max: 84 },
      { range: '85-89', min: 85, max: 89 },
      { range: '90-94', min: 90, max: 94 },
      { range: '95-100', min: 95, max: 100 },
    ];

    const data: GradeData[] = gpaRanges.map(({ range }) => ({
      gpaRange: range,
      male: 0,
      female: 0,
      total: 0,
    }));

    // Process student grades
    studentGrades.forEach(studentGrade => {
      const range = gpaRanges.find(r => 
        studentGrade.averageGrade >= r.min && studentGrade.averageGrade <= r.max
      );
      
      if (range) {
        const dataIndex = data.findIndex(d => d.gpaRange === range.range);
        if (dataIndex !== -1) {
          if (studentGrade.sex === 'Male') {
            data[dataIndex].male++;
          } else if (studentGrade.sex === 'Female') {
            data[dataIndex].female++;
          }
          data[dataIndex].total++;
        }
      }
    });

    setGradeData(data);
  }, [studentGrades]);

  // Chart data for Bar Chart
  const barChartData = {
    labels: gradeData.map(item => item.gpaRange),
    datasets: [
      {
        label: 'Male',
        data: gradeData.map(item => item.male),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Female',
        data: gradeData.map(item => item.female),
        backgroundColor: 'rgba(236, 72, 153, 0.8)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for Pie Chart
  const pieChartData = {
    labels: gradeData.flatMap(item => [
      `Male (${item.gpaRange})`,
      `Female (${item.gpaRange})`
    ]).filter((_, index) => {
      const itemIndex = Math.floor(index / 2);
      const isMale = index % 2 === 0;
      return isMale ? gradeData[itemIndex].male > 0 : gradeData[itemIndex].female > 0;
    }),
    datasets: [
      {
        data: gradeData.flatMap(item => [item.male, item.female]).filter(value => value > 0),
        backgroundColor: [
          '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
          '#A855F7', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#06B6D4',
          '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E', '#A855F7'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Student Grade Distribution${selectedSemester !== 'all' ? ` - ${selectedSemester}` : ''}${selectedSchoolYear !== 'all' ? ` (${selectedSchoolYear})` : ''}`,
      },
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    } : undefined,
  };

  const totalStudents = gradeData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="bg-base-100 rounded-xl border border-base-300 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <HiChartBar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold martian-mono text-primary">Academic Progress</h2>
            <p className="text-sm text-base-content/60 font-normal italic">
              Student grade distribution analysis
            </p>
          </div>
        </div>

        {/* Chart Type Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-outline'}`}
          >
            <HiChartBar className="w-4 h-4" />
            Bar
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`btn btn-sm ${chartType === 'pie' ? 'btn-primary' : 'btn-outline'}`}
          >
            <HiChartPie className="w-4 h-4" />
            Pie
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-base-50 rounded-lg">
        <div className="flex items-center gap-2">
          <HiFilter className="w-4 h-4 text-base-content/60" />
          <span className="text-sm font-medium text-base-content">Filters:</span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs">Semester</span>
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="select select-bordered select-sm w-full max-w-xs"
            >
              <option value="all">All Semesters</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>
                  {semester} Semester
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs">School Year</span>
            </label>
            <select
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="select select-bordered select-sm w-full max-w-xs"
            >
              <option value="all">All Years</option>
              {schoolYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        {loading ? (
          <div className="h-96 flex items-center justify-center bg-base-50 rounded-lg">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 text-base-content/60">Loading grade data...</p>
            </div>
          </div>
        ) : selectedSemester === 'all' || selectedSchoolYear === 'all' ? (
          <div className="h-96 flex items-center justify-center bg-base-50 rounded-lg">
            <div className="text-center">
              <HiChartBar className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-base-content mb-2">Select Filters</h3>
              <p className="text-base-content/60">
                Please select both semester and school year to view grade distribution
              </p>
            </div>
          </div>
        ) : totalStudents > 0 ? (
          <div className="h-96">
            {chartType === 'bar' ? (
              <Bar data={barChartData} options={chartOptions} />
            ) : (
              <Pie data={pieChartData} options={chartOptions} />
            )}
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center bg-base-50 rounded-lg">
            <div className="text-center">
              <HiChartBar className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-base-content mb-2">No Data Available</h3>
              <p className="text-base-content/60">
                No students found for the selected filters
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {totalStudents > 0 && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-base-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary martian-mono">{totalStudents}</p>
            <p className="text-xs text-base-content/60">Total Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary martian-mono">
              {gradeData.reduce((sum, item) => sum + item.male, 0)}
            </p>
            <p className="text-xs text-base-content/60">Male Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary martian-mono">
              {gradeData.reduce((sum, item) => sum + item.female, 0)}
            </p>
            <p className="text-xs text-base-content/60">Female Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary martian-mono">
              {studentGrades.length > 0 ? 
                Math.round((studentGrades.reduce((sum, s) => sum + s.averageGrade, 0) / studentGrades.length) * 100) / 100 : 0
              }
            </p>
            <p className="text-xs text-base-content/60">Average Grade</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeChart;
