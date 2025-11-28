import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Menu, LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { ASSETS_URL } from "@/constants/auth";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title?: string;
}

// Helper function to format role names
const formatRoleName = (role: string | undefined): string => {
  if (!role) return "Rol Desconocido";
  switch (role.toLowerCase()) {
    case "super_admin":
      return "Superadministrador";
    case "admin":
      return "Administrador";
    case "user":
      return "Usuario";
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

/**
 * DashboardHeader Component
 * Top navigation bar with breadcrumbs, notifications, and user menu
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuClick,
  breadcrumbs = [],
  title,
}) => {
  const { t } = useTranslation();
  const { user, logout, updateUser } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error("Failed to fetch notification count", error);
      }
    };

    if (user) {
      fetchUnreadCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Reset image error when avatar changes
  useEffect(() => {
    setImageError(false);
  }, [user?.avatar]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const getAvatarUrl = (avatar: string) => {
    if (!avatar) return null;
    if (avatar.startsWith("http")) {
      return avatar;
    }
    return `${ASSETS_URL}${avatar}`;
  };

  const getInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return null;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      {/* Left Side - Mobile Menu + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-gray-500 hover:text-gray-700 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mx-2 text-gray-300">/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-gray-900 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span
                  className={
                    index === breadcrumbs.length - 1
                      ? "font-medium text-gray-900"
                      : ""
                  }
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile & Dropdown */}
        <div className="relative flex items-center gap-3" ref={dropdownRef}>
          {/* User Name */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {formatRoleName(user?.role)}
            </p>
          </div>

          {/* Avatar Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 overflow-hidden"
          >
             {user?.avatar && !imageError && getAvatarUrl(user.avatar) ? (
               <img
                 src={getAvatarUrl(user.avatar)!}
                 alt="Profile"
                 className="h-full w-full object-cover"
                 onError={handleImageError}
               />
             ) : (
               getInitial() || <UserIcon className="h-5 w-5" />
             )}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg focus:outline-none z-50">
              <div className="border-b border-gray-100 px-4 py-3 sm:hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                   {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {formatRoleName(user?.role)}
                </p>
              </div>
              
              <div className="py-1">
                <a
                  href="/dashboard/profile"
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <UserIcon className="mr-3 h-4 w-4 text-gray-500" />
                  Mi Perfil
                </a>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="mr-3 h-4 w-4 text-gray-500" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
