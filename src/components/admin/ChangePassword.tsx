"use client"
import React, { useState } from 'react';
import { HiKey, HiEye, HiEyeOff, HiCheck } from 'react-icons/hi';

interface ChangePasswordProps {
  onCancel: () => void;
  loading?: boolean;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'New password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // TODO: Implement password change API call
      console.log('Changing password...', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form on success
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
      
      // Show success message (you might want to use a toast notification)
      alert('Password changed successfully!');
      
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors({ submit: 'Failed to change password. Please try again.' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="bg-base-100 rounded-xl shadow-lg border border-base-300">
      <div className="p-6 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
            <HiKey className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold martian-mono text-primary">
              Change Password
            </h3>
            <p className="text-xs text-base-content/60 italic font-normal">
              Update your account password for security
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="text-sm font-medium text-base-content">
            Current Password *
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={handleInputChange}
              placeholder="Enter your current password"
              className={`input input-bordered w-full pr-12 ${
                errors.currentPassword ? 'input-error' : ''
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/60 hover:text-base-content"
              disabled={loading}
            >
              {showPasswords.current ? (
                <HiEyeOff className="w-5 h-5" />
              ) : (
                <HiEye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-error text-xs">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium text-base-content">
            New Password *
          </label>
          <div className="relative">
            <input
              id="newPassword"
              name="newPassword"
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="Enter your new password"
              className={`input input-bordered w-full pr-12 ${
                errors.newPassword ? 'input-error' : ''
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/60 hover:text-base-content"
              disabled={loading}
            >
              {showPasswords.new ? (
                <HiEyeOff className="w-5 h-5" />
              ) : (
                <HiEye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-error text-xs">{errors.newPassword}</p>
          )}
          <div className="text-xs text-base-content/60">
            Password must be at least 8 characters with uppercase, lowercase, and number
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-base-content">
            Confirm New Password *
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your new password"
              className={`input input-bordered w-full pr-12 ${
                errors.confirmPassword ? 'input-error' : ''
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/60 hover:text-base-content"
              disabled={loading}
            >
              {showPasswords.confirm ? (
                <HiEyeOff className="w-5 h-5" />
              ) : (
                <HiEye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-error text-xs">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="alert alert-error">
            <span className="text-sm">{errors.submit}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary text-white martian-mono flex-1 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Changing Password...
              </>
            ) : (
              <>
                <HiCheck className="w-4 h-4" />
                Change Password
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-outline flex martian-mono text-primary items-center gap-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
