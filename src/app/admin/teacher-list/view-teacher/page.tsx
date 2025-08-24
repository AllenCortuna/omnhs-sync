"use client";
import { Teacher } from '@/interface/user';
import { doc, getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { db } from '../../../../../firebase';
import { formatDate } from '@/config/format';
import { BackButton } from '@/components/common';

const ViewTeacher = () => {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [teacher, setTeacher] = useState<Teacher | null>(null);

    useEffect(() => {
        const fetchTeacher = async () => {
            if (!id) return;
            
            try {
                const teacherRef = doc(db, "teachers", id);
                const teacherDoc = await getDoc(teacherRef);
                if (teacherDoc.exists()) {
                    setTeacher({ id: teacherDoc.id, ...teacherDoc.data() } as unknown as Teacher);
                }
            } catch (error) {
                console.error("Error fetching teacher:", error);
            }
        }
        fetchTeacher();
    }, [id]);

    if (!id) {
        return <div>Invalid teacher ID</div>;
    }

    if (!teacher) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen text-zinc-700">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-6">
                    <BackButton
                    />
                    <div>
                        <h1 className="font-bold text-primary martian-mono">Teacher Information</h1>
                        <p className="text-xs text-zinc-500 italic">
                            View detailed teacher profile
                        </p>
                    </div>
                </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title">Personal Information</h2>
                        <div className="space-y-2">
                            <p><span className="font-semibold">Employee ID:</span> {teacher.employeeId}</p>
                            <p><span className="font-semibold">Name:</span> {teacher.firstName} {teacher.middleName} {teacher.lastName}</p>
                            <p><span className="font-semibold">Email:</span> {teacher.email}</p>
                            <p><span className="font-semibold">Designation:</span> {teacher.designation || "N/A"}</p>
                            <p><span className="font-semibold">Contact Number:</span> {teacher.contactNumber || "N/A"}</p>
                            <p><span className="font-semibold">Address:</span> {teacher.address || "N/A"}</p>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title">System Information</h2>
                        <div className="space-y-2">
                            <p><span className="font-semibold">Created At:</span> {formatDate(teacher.createdAt || "")}</p>
                            <p><span className="font-semibold">Last Login:</span> {formatDate(teacher.lastLoginAt || "")}</p>
                            <p><span className="font-semibold">Profile Reference:</span> {teacher.profileRef || "N/A"}</p>
                            <p><span className="font-semibold">Designated Section ID:</span> {teacher.designatedSectionId || "N/A"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}

export default ViewTeacher 