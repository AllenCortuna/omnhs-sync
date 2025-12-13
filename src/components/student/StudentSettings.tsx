"use client"
import React, { useState } from 'react';
import { HiCog, HiArrowLeft, HiKey } from 'react-icons/hi';
import ChangePassword from '../admin/ChangePassword';
import StudentLogs from './StudentLogs';

interface StudentSettingsProps {
  studentId: string;
}

const StudentSettings: React.FC<StudentSettingsProps> = ({ studentId }) => {
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleToggleChangePassword = () => {
    setShowChangePassword(!showChangePassword);
  };

  const handleCancelChangePassword = () => {
    setShowChangePassword(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <HiCog className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold martian-mono text-primary">Student Settings</h1>
          <p className="text-base-content/60 font-normal text-xs italic">Manage your account settings and view activity logs</p>
        </div>
      </div>

      {/* Content */}
      {showChangePassword ? (
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={handleCancelChangePassword}
            className="btn btn-ghost btn-sm gap-2"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Logs
          </button>

          {/* Change Password Form */}
          <ChangePassword
            onCancel={handleCancelChangePassword}
            loading={false}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleToggleChangePassword}
              className="btn btn-primary text-white martian-mono btn-sm gap-2"
            >
              <HiKey className="w-4 h-4" />
              Change Password
            </button>
          </div>

          {/* Student Logs Component - Always visible by default */}
          <StudentLogs studentId={studentId} />
        </div>
      )}
    </div>
  );
};

export default StudentSettings;

