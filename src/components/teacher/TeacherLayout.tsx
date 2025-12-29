"use client"
import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { HiHome, HiAcademicCap, HiUserGroup, HiLogout, HiMenu, HiX, HiCalendar, HiCog, HiClipboardList, HiBookOpen } from 'react-icons/hi';
import { auth } from '../../../firebase';

// Types and Interfaces
interface TeacherLayoutProps {
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
 * TeacherLayout Component
 * Provides the main layout structure for teacher pages including:
 * - Sidebar navigation
 * - Header with teacher portal branding
 * - Navigation menu with active state handling
 * - Logout functionality
 * - Content area for child components
 * - Responsive mobile menu
 * - Notifications for pending items
 */
const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const primaryNavItems: NavigationItemProps[] = [
    { href: '/teachers/dashboard', icon: HiHome, label: 'Dashboard' },
    { href: '/teachers/sections', icon: HiClipboardList, label: 'My Section' },
    { href: '/teachers/class-schedule', icon: HiCalendar, label: 'Class Schedule' },
    { href: '/teachers/subjects', icon: HiBookOpen, label: 'Subjects' },
    { href: '/teachers/students', icon: HiUserGroup, label: 'Students' },
    { href: '/teachers/calendar', icon: HiCalendar, label: 'Calendar' },
    { href: '/teachers/my-calendar', icon: HiCalendar, label: 'My Calendar' },
    { href: '/teachers/settings', icon: HiCog, label: 'Settings' },
  ];

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
          <span className={`truncate font-normal text-md ${isActive ? 'text-white martian-mono' : 'text-primary group-hover:text-primary-dark'}`}>{label}</span>
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
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div 
        className={`fixed lg:static w-72 bg-base-100 shadow-xl flex flex-col h-screen z-40 transition-transform duration-300 border-r ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header Section */}
        <div className="p-6 border-b border-primary-content/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <HiAcademicCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary martian-mono">OMNHSYNC</h2>
              <p className="text-primary text-sm">Teacher Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4 text-white">
          <ul className="menu p-0 w-full space-y-2">
            {primaryNavItems.map((item) => (
              <NavigationItem key={item.href} {...item} />
            ))}
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
            <span className="truncate font-normal text-md text-primary group-hover:text-white">Logout</span>
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

export default TeacherLayout; 