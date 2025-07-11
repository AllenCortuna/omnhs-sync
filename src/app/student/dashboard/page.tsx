"use client";
import React from "react";
import { MdSchool, MdPerson, MdEmail, MdCalendarToday } from "react-icons/md";

/**
 * @file StudentDashboard.tsx - Student dashboard page
 * @module StudentDashboard
 * 
 * @description
 * This component provides a dashboard for students after they complete their profile.
 * It displays basic student information and provides navigation to various features.
 *
 * @requires react
 * @requires react-icons/md
 */

const StudentDashboard: React.FC = () => {
    return (
        <div className="min-h-screen p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
                                <MdSchool className="text-xl" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-base-content">Student Dashboard</h1>
                            <p className="text-base-content/60">Welcome to your student portal</p>
                        </div>
                    </div>
                </div>

                {/* Welcome Card */}
                <div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-16 h-16 flex items-center justify-center">
                                    <MdPerson className="text-2xl" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Welcome!</h2>
                                <p className="text-base-content/60">
                                    Your profile has been completed successfully. You can now access all student features.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdSchool className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Student ID</h3>
                                    <p className="text-sm text-base-content/60">Your unique identifier</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-secondary/20 p-3 rounded-lg">
                                    <MdEmail className="text-secondary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Email</h3>
                                    <p className="text-sm text-base-content/60">Your registered email</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-accent/20 p-3 rounded-lg">
                                    <MdCalendarToday className="text-accent text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Account Created</h3>
                                    <p className="text-sm text-base-content/60">Your registration date</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <h3 className="card-title text-lg">View Profile</h3>
                            <p className="text-base-content/60 text-sm">
                                View and edit your personal information
                            </p>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <h3 className="card-title text-lg">Academic Records</h3>
                            <p className="text-base-content/60 text-sm">
                                Access your grades and academic history
                            </p>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <h3 className="card-title text-lg">Class Schedule</h3>
                            <p className="text-base-content/60 text-sm">
                                View your current class schedule
                            </p>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <h3 className="card-title text-lg">Assignments</h3>
                            <p className="text-base-content/60 text-sm">
                                Check your pending assignments
                            </p>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <h3 className="card-title text-lg">Messages</h3>
                            <p className="text-base-content/60 text-sm">
                                View messages from teachers and staff
                            </p>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <h3 className="card-title text-lg">Settings</h3>
                            <p className="text-base-content/60 text-sm">
                                Manage your account settings
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard; 