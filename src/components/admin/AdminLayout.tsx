"use client"
import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { HiHome, HiAcademicCap, HiUserGroup, HiUserAdd, HiShieldCheck, HiLogout, HiMenu, HiX } from 'react-icons/hi';
import { auth } from '../../../firebase';

// Types and Interfaces
interface AdminLayoutProps {
  children: ReactNode;
}

interface NavigationItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  showNotification?: boolean;
  notificationCount?: number;
  loading?: boolean;
}

/**
 * AdminLayout Component
 * Provides the main layout structure for admin pages including:
 * - Sidebar navigation
 * - Header with admin portal branding
 * - Navigation menu with active state handling
 * - Logout functionality
 * - Content area for child components
 * - Responsive mobile menu
 * - Notifications for pending item requests
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const primaryNavItems: NavigationItemProps[] = [
    { href: '/admin/dashboard', icon: HiHome, label: 'Dashboard' },
    { href: '/admin/student-list', icon: HiAcademicCap, label: 'Student List' },
    { href: '/admin/teacher-list', icon: HiUserGroup, label: 'Teacher List' },
    { href: '/admin/enrollees', icon: HiUserAdd, label: 'Enrollee' },
  ];

  // const [showSecondary, setShowSecondary] = useState(false);

  /**
   * Handles user logout
   * Signs out the user and redirects to home page
   */
  const handleLogout = async (): Promise<void> => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Renders a navigation item with consistent styling and optional notification badge
   */
  const NavigationItem = ({ href, icon: Icon, label, showNotification = false, notificationCount = 0, loading = false }: NavigationItemProps) => {
    const isActive = pathname === href;
    
    return (
      <li>
        <Link
          href={href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group relative
            ${isActive
              ? 'bg-primary text-white shadow font-semibold'
              : 'text-primary hover:bg-primary/10 hover:text-primary-dark'
            }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative
            ${isActive
              ? 'bg-white/20 text-white'
              : 'text-primary bg-primary/20 group-hover:text-primary-dark'
            }`}
          >
            <Icon className="w-5 h-5" />
            {/* Notification Badge */}
            {showNotification && notificationCount > 0 && !loading && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold min-w-[20px]">
                {notificationCount > 99 ? '99+' : notificationCount}
              </div>
            )}
          </div>
          <span className={`truncate font-normal ${isActive ? 'text-white martian-mono' : 'text-primary group-hover:text-primary-dark'}`}>{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="flex min-h-screen bg-base-100 apercu-mono">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-primary text-white"
      >
        {isMobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed lg:static w-72 bg-base-100 shadow-xl flex flex-col h-full z-40 transition-transform duration-300 border-r border-primary${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header Section */}
        <div className="p-6 border-b border-primary-content/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <HiShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary martian-mono">OMNHS SYNC</h2>
              <p className="text-primary text-sm">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4 text-white">
          <ul className="menu p-0 w-full space-y-2">
            {primaryNavItems.map((item) => (
              <NavigationItem key={item.href} {...item} />
            ))}
            {/* <li>
              <button
                className="btn btn-ghost w-full mt-2"
                onClick={() => setShowSecondary((prev) => !prev)}
              >
                {showSecondary ? "Hide More" : "Show More"}
                {showSecondary ? <HiChevronUp className="w-5 h-5" /> : <HiChevronDown className="w-5 h-5" />}
              </button>
            </li> */}
          </ul>
        </div>

        {/* Footer Section with Logout */}
        <div className="p-4 border-t border-primary-content/20 space-y-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 p-4 rounded-xl transition-all duration-200 group relative text-primary hover:bg-primary hover:text-white"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors group-hover:text-white bg-primary/20 group-hover:bg-primary-dark">
              <HiLogout className="w-5 h-5" />
            </div>
            <span className="truncate font-normal text-primary group-hover:text-white">Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-base-50">
        <div className="h-full overflow-y-auto">
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;