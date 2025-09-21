"use client"
import React, { useState } from 'react';
import { HiCog, HiKey, HiArrowLeft, HiDocumentText } from 'react-icons/hi';
import ChangePassword from '../admin/ChangePassword';
import TeacherLogs from './TeacherLogs';

interface TeacherSettingsProps {
  teacherId?: string;
}

const TeacherSettings: React.FC<TeacherSettingsProps> = ({ teacherId }) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  console.log('teacherId', teacherId);

  const handleToggleChangePassword = () => {
    setShowChangePassword(!showChangePassword);
  };

  const handleCancelChangePassword = () => {
    setShowChangePassword(false);
  };

  const handleToggleLogs = () => {
    setShowLogs(!showLogs);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <HiCog className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold martian-mono text-primary">Teacher Settings</h1>
          <p className="text-xs text-base-content/60 italic font-normal">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Content */}
      {showChangePassword ? (
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={handleCancelChangePassword}
            className="btn btn-ghost btn-sm martian-mono text-primary gap-2"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>

          {/* Change Password Form */}
          <ChangePassword
            onCancel={handleCancelChangePassword}
          />
        </div>
      ) : showLogs ? (
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={() => setShowLogs(false)}
            className="btn btn-ghost btn-sm martian-mono text-primary gap-2"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>

          {/* Teacher Logs Component */}
          {teacherId ? (
            <TeacherLogs teacherId={teacherId} />
          ) : (
            <div className="text-center py-12">
              <HiDocumentText className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
              <h3 className="text-sm martian-mono font-bold text-primary mb-2">Teacher Information Required</h3>
              <p className="text-base-content/60 text-xs font-normal italic">
                Unable to load logs. Teacher information is not available.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Settings Content */}
          <div className="bg-base-100 rounded-xl border border-base-300 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <HiCog className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold martian-mono text-primary">Account Settings</h2>
                <p className="text-xs text-base-content/60 font-normal italic">
                  Manage your teacher account preferences and security settings
                </p>
              </div>
            </div>

            {/* Settings Options */}
            <div className="space-y-4">
              <div className="p-4 border border-base-200 rounded-lg hover:bg-base-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <HiKey className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm martian-mono font-bold text-primary">Password Security</h3>
                      <p className="text-xs font-normal italic text-base-content/60">Update your account password for better security</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleChangePassword}
                    className="btn btn-primary text-white martian-mono btn-sm"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <div className="p-4 border border-base-200 rounded-lg hover:bg-base-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <HiDocumentText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm martian-mono font-bold text-primary">Activity Logs</h3>
                      <p className="text-xs font-normal italic text-base-content/60">View your teaching activities and actions</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleLogs}
                    className="btn btn-outline text-primary martian-mono btn-sm"
                  >
                    View Logs
                  </button>
                </div>
              </div>

              {/* Placeholder for future settings */}
              {/* <div className="p-4 border border-base-200 rounded-lg opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-base-200 rounded-lg flex items-center justify-center">
                    <HiCog className="w-5 h-5 text-base-content/40" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base-content/60">Notification Preferences</h3>
                    <p className="text-sm text-base-content/40">Manage your notification settings (Coming Soon)</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-base-200 rounded-lg opacity-50"> 
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-base-200 rounded-lg flex items-center justify-center">
                    <HiCog className="w-5 h-5 text-base-content/40" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base-content/60">Profile Settings</h3>
                    <p className="text-sm text-base-content/40">Update your profile information (Coming Soon)</p>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSettings;
