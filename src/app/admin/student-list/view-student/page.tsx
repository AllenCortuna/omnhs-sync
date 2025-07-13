"use client";
import { Student } from '@/interface/user';
import { doc, getDoc } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { db } from '../../../../../firebase';
import { formatDate } from '@/config/format';
import { BackButton } from '@/components/common';

const ViewStudent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const [student, setStudent] = useState<Student | null>(null);

    useEffect(() => {
        const fetchStudent = async () => {
            if (!id) return;
            
            try {
                const studentRef = doc(db, "students", id);
                const studentDoc = await getDoc(studentRef);
                if (studentDoc.exists()) {
                    setStudent({ id: studentDoc.id, ...studentDoc.data() } as Student);
                }
            } catch (error) {
                console.error("Error fetching student:", error);
            }
        }
        fetchStudent();
    }, [id]);

    if (!id) {
        return <div>Invalid student ID</div>;
    }

    if (!student) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen text-zinc-700">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-6">
                    <BackButton
                        onClick={() => router.back()}
                        variant="outline"
                        size="sm"
                    />
                    <div>
                        <h1 className="text-2xl font-bold">Student Information</h1>
                        <p className="text-sm text-base-content/60">
                            View detailed student profile
                        </p>
                    </div>
                </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title">Personal Information</h2>
                        <div className="space-y-2">
                            <p><span className="font-semibold">Student ID:</span> {student.studentId}</p>
                            <p><span className="font-semibold">Name:</span> {student.firstName} {student.middleName} {student.lastName} {student.suffix}</p>
                            <p><span className="font-semibold">Email:</span> {student.email}</p>
                            <p><span className="font-semibold">Sex:</span> {student.sex}</p>
                            <p><span className="font-semibold">Birth Date:</span> {formatDate(student.birthDate || "")}</p>
                            <p><span className="font-semibold">Birth Place:</span> {student.birthPlace}</p>
                            <p><span className="font-semibold">Civil Status:</span> {student.civilStatus}</p>
                            <p><span className="font-semibold">Nationality:</span> {student.nationality}</p>
                            <p><span className="font-semibold">Religion:</span> {student.religion}</p>
                            <p><span className="font-semibold">Mother Tongue:</span> {student.motherTongue}</p>
                            <p><span className="font-semibold">Contact Number:</span> {student.contactNumber}</p>
                            <p><span className="font-semibold">Address:</span> {student.address}</p>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title">Family Information</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold">Father&apos;s Information</h3>
                                <p>Name: {student.fatherName}</p>
                                <p>Occupation: {student.fatherOccupation}</p>
                                <p>Contact: {student.fatherContactNumber}</p>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold">Mother&apos;s Information</h3>
                                <p>Name: {student.motherName}</p>
                                <p>Occupation: {student.motherOccupation}</p>
                                <p>Contact: {student.motherContactNumber}</p>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold">Guardian&apos;s Information</h3>
                                <p>Name: {student.guardianName}</p>
                                <p>Occupation: {student.guardianOccupation}</p>
                                <p>Contact: {student.guardianContactNumber}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title">System Information</h2>
                        <div className="space-y-2">
                            <p><span className="font-semibold">Created At:</span> {formatDate(student.createdAt || "")}</p>
                            <p><span className="font-semibold">Last Login:</span> {formatDate(student.lastLoginAt || "")}</p>
                            <p><span className="font-semibold">Last Updated:</span> {formatDate(student.updatedAt || "")}</p>
                            <p><span className="font-semibold">Profile Complete:</span> {student.profileComplete ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}

export default ViewStudent