"use client";
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { strandService } from '@/services/strandService';
import { errorToast } from '@/config/toast';
import type { Strand, Enrollment } from '@/interface/info';
import { HiUsers } from 'react-icons/hi';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface EnrollmentData {
  strandName: string;
  grade11Count: number;
  grade12Count: number;
  totalCount: number;
}

const SEMESTER_OPTIONS = [
  { value: "1st", label: "1st Semester" },
  { value: "2nd", label: "2nd Semester" },
];

function getSchoolYearOptions(): { value: string; label: string }[] {
  const now = new Date();
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;
  return [
    { value: `${lastYear}-${thisYear}`, label: `${lastYear}-${thisYear}` },
    { value: `${thisYear}-${thisYear + 1}`, label: `${thisYear}-${thisYear + 1}` },
  ];
}

const EnrollmentChart: React.FC = () => {
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [strands, setStrands] = useState<Strand[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Fetch strands on component mount
  useEffect(() => {
    const fetchStrands = async () => {
      try {
        const fetchedStrands = await strandService.getAllStrands();
        setStrands(fetchedStrands);
      } catch (error) {
        console.error('Error fetching strands:', error);
        errorToast('Failed to load strands');
      }
    };
    fetchStrands();
  }, []);

  // Fetch enrollment data when semester and school year are selected
  useEffect(() => {
    if (selectedSemester && selectedSchoolYear) {
      fetchEnrollmentData();
    } else {
      setEnrollmentData([]);
      setHasData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester, selectedSchoolYear]);

  const fetchEnrollmentData = async () => {
    if (!selectedSemester || !selectedSchoolYear) return;

    try {
      setLoading(true);
      
      // Query approved enrollments for the selected semester and school year
      const enrollmentQuery = query(
        collection(db, "enrollment"),
        where("status", "==", "approved"),
        where("semester", "==", selectedSemester),
        where("schoolYear", "==", selectedSchoolYear)
      );

      const querySnapshot = await getDocs(enrollmentQuery);
      const enrollments: Enrollment[] = [];
      
      querySnapshot.forEach((doc) => {
        enrollments.push({ id: doc.id, ...doc.data() } as Enrollment);
      });

      // Process enrollment data by strand and grade level
      const processedData: EnrollmentData[] = strands.map(strand => {
        const strandEnrollments = enrollments.filter(
          enrollment => enrollment.strandId === strand.id
        );

        const grade11Count = strandEnrollments.filter(
          enrollment => enrollment.gradeLevel === "Grade 11"
        ).length;

        const grade12Count = strandEnrollments.filter(
          enrollment => enrollment.gradeLevel === "Grade 12"
        ).length;

        return {
          strandName: strand.strandName,
          grade11Count,
          grade12Count,
          totalCount: grade11Count + grade12Count
        };
      });

      setEnrollmentData(processedData);
      setHasData(processedData.some(data => data.totalCount > 0));
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
      errorToast('Failed to load enrollment data');
      setEnrollmentData([]);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  // Chart configuration for population pyramid
  const chartData = {
    labels: enrollmentData.map(data => data.strandName),
    datasets: [
      {
        label: 'Grade 11',
        data: enrollmentData.map(data => -data.grade11Count), // Negative values for left side
        backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red color for Grade 11
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
      },
      {
        label: 'Grade 12',
        data: enrollmentData.map(data => data.grade12Count), // Positive values for right side
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue color for Grade 12
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'Martian Mono, monospace',
            size: 12,
          },
          color: '#374151',
        },
      },
      title: {
        display: true,
        text: `Enrolled Students per Strand - ${selectedSemester} Semester ${selectedSchoolYear}`,
        font: {
          family: 'Martian Mono, monospace',
          size: 16,
          weight: 'bold' as const,
        },
        color: '#374151',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: 'Martian Mono, monospace',
        },
        bodyFont: {
          family: 'Martian Mono, monospace',
        },
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = Math.abs(context.parsed.x); // Show absolute value
            return `${label}: ${value} students`;
          }
        }
      },
    },
    scales: {
      x: {
        beginAtZero: false,
        ticks: {
          font: {
            family: 'Martian Mono, monospace',
            size: 11,
          },
          color: '#6b7280',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: function(value: any) {
            return Math.abs(Number(value)); // Show absolute values on x-axis
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        // Add center line
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        afterBuildTicks: function(scale: any) {
          scale.ticks.push({ value: 0, label: '' });
        }
      },
      y: {
        ticks: {
          font: {
            family: 'Martian Mono, monospace',
            size: 11,
          },
          color: '#374151',
        },
        grid: {
          display: false,
        },
      },
    },
  };


  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
          <HiUsers className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary martian-mono">Enrollment Population Pyramid</h2>
          <p className="text-gray-500 italic text-xs">Student enrollment distribution by strand and grade level</p>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-normal text-gray-600 mb-2">
            Semester
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="select select-bordered w-full martian-mono text-xs text-primary"
            disabled={loading}
          >
            <option value="">Select Semester</option>
            {SEMESTER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-normal text-gray-600 mb-2">
            School Year
          </label>
          <select
            value={selectedSchoolYear}
            onChange={(e) => setSelectedSchoolYear(e.target.value)}
            className="select select-bordered w-full martian-mono text-xs text-primary"
            disabled={loading}
          >
            <option value="">Select School Year</option>
            {getSchoolYearOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Display */}
      {!selectedSemester || !selectedSchoolYear ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiUsers className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">Select semester and school year to view enrollment data</p>
          <p className="text-gray-400 text-sm italic">Only approved enrollments are displayed</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-gray-500">Loading enrollment data...</p>
        </div>
      ) : !hasData ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiUsers className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">No enrollment data found</p>
          <p className="text-gray-400 text-sm italic">
            No approved enrollments for {selectedSemester} semester {selectedSchoolYear}
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            {/* Chart Labels */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs font-medium text-primary martian-mono">Grade 11</span>
              </div>
              <div className="text-center">
                <div className="w-px h-8 bg-gray-300 mx-auto"></div>
                <span className="text-xs text-gray-500 martian-mono">Strands</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary martian-mono">Grade 12</span>
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
              </div>
            </div>
            
            <div style={{ height: '400px', width: '100%' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentChart;
