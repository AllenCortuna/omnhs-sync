"use client"
import React, { useState } from 'react';
import { HiCog, HiArrowLeft, HiKey, HiDocumentReport } from 'react-icons/hi';
import ChangePassword from './ChangePassword';
import Logs from './Logs';
import EnrollmentReport from './EnrollmentReport';

const AdminSettings: React.FC = () => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEnrollmentReport, setShowEnrollmentReport] = useState(false);

  const handleToggleChangePassword = () => {
    setShowChangePassword(!showChangePassword);
    setShowEnrollmentReport(false);
  };

  const handleCancelChangePassword = () => {
    setShowChangePassword(false);
  };

  const handleToggleEnrollmentReport = () => {
    setShowEnrollmentReport(!showEnrollmentReport);
    setShowChangePassword(false);
  };

  const handleBackFromReport = () => {
    setShowEnrollmentReport(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <HiCog className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold martian-mono text-primary">Admin Settings</h1>
          <p className="text-base-content/60 font-normal text-xs italic">Manage system configurations and academic data</p>
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
            Back to Settings
          </button>

          {/* Change Password Form */}
          <ChangePassword
            onCancel={handleCancelChangePassword}
            loading={false}
          />
        </div>
      ) : showEnrollmentReport ? (
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={handleBackFromReport}
            className="btn btn-ghost btn-sm gap-2"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>

          {/* Enrollment Report Component */}
          <EnrollmentReport />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleToggleEnrollmentReport}
              className="btn btn-primary text-white martian-mono btn-sm gap-2"
            >
              <HiDocumentReport className="w-4 h-4" />
              Enrollment Report
            </button>
            <button
              onClick={handleToggleChangePassword}
              className="btn btn-primary text-white martian-mono btn-sm gap-2"
            >
              <HiKey className="w-4 h-4" />
              Change Password
            </button>
          </div>

          {/* Logs Component - Always visible by default */}
          <Logs />
        </div>
      )}
    </div>
  );
};

export default AdminSettings; 