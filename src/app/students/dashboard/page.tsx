"use client";
import React from "react";
import { MdSchool, MdPerson, MdEmail, MdCalendarToday, MdAssignment, MdMessage, MdSettings } from "react-icons/md";

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
        <div className="h-full p-8 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center">
                                <MdSchool className="text-xl text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl martian-mono font-bold text-primary">Student Dashboard</h1>
                            <p className="text-xs text-zinc-500 italic">Welcome to your student portal</p>
                        </div>
                    </div>
                </div>

                {/* Welcome Card */}
                <div className="card bg-base-100 shadow mb-6">
                    <div className="card-body">
                        <div className="flex items-center gap-4">
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
                                    <MdPerson className="text-xl text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-primary martian-mono">Welcome!</h2>
                                <p className="text-xs text-zinc-500 italic">
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
                                    <h3 className="font-bold text-primary martian-mono">Student ID</h3>
                                    <p className="text-xs text-zinc-500 italic">Your unique identifier</p>
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
                                    <h3 className="font-bold text-primary martian-mono">Email</h3>
                                    <p className="text-xs text-zinc-500 italic">Your registered email</p>
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
                                    <h3 className="font-bold text-primary martian-mono">Account Created</h3>
                                    <p className="text-xs text-zinc-500 italic">Your registration date</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdPerson className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">View Profile</h3>
                                    <p className="text-xs text-zinc-500 italic">View and edit your information</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdSchool className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">Academic Records</h3>
                                    <p className="text-xs text-zinc-500 italic">Access your academic records</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdCalendarToday className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">Class Schedule</h3>
                                    <p className="text-xs text-zinc-500 italic">View your class schedule</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdAssignment className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">Assignments</h3>
                                    <p className="text-xs text-zinc-500 italic">Check pending assignments</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdMessage className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">Messages</h3>
                                    <p className="text-xs text-zinc-500 italic">View messages from teachers</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="card-body">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-3 rounded-lg">
                                    <MdSettings className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary martian-mono">Settings</h3>
                                    <p className="text-xs text-zinc-500 italic">Manage your account</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard; 