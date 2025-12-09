import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Menu, LogOut, User as UserIcon, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import { ASSETS_URL } from "@/constants/auth";
import { getCurrentLocale, routes } from "@/lib/routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  title?: string;
  onNavigate?: (path: string) => void;
}

// Helper function to format role names using i18n
const formatRoleName = (role: string | undefined, t: (key: string) => string): string => {
  if (!role) return t('roles.USER');

  // El backend devuelve roles en mayúsculas (ADMIN, USER, SUPER_ADMIN)
  const roleKey = `roles.${role}`;
  const translatedRole = t(roleKey);

  // Si la traducción existe (no devuelve la key), usarla; sino usar el rol original
  return translatedRole !== roleKey ? translatedRole : role;
};

/**
 * DashboardHeader Component
 * Top navigation bar with breadcrumbs, notifications, and user menu
 * Refactored following Refactoring UI principles
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuClick,
  breadcrumbs = [],
  title,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const locale = getCurrentLocale();

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data } = await api.get("/notifications/unread-count");
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

  const handleLogout = async () => {
    await logout();
    window.location.href = routes[locale].login;
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
    return "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName || ""}`.trim();
    }
    return user?.email || "";
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const hasNotifications = unreadCount > 0;

  return (
    <header className={`rui-navbar ${onMenuClick ? "has-menu-toggle" : ""}`}>
      {/* Left Side - Mobile Menu + Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="rui-menu-toggle"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="hidden sm:flex items-center text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="mx-2 text-muted-foreground/50">/</span>
                )}
                {crumb.href ? (
                  <button
                    onClick={() => onNavigate?.(crumb.href!)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {index === 0 && <ArrowLeft className="h-4 w-4" />}
                    {crumb.label}
                  </button>
                ) : (
                  <span
                    className={
                      index === breadcrumbs.length - 1
                        ? "font-medium text-foreground"
                        : ""
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
      </div>

      {/* Right Side - Actions */}
      <div className="rui-navbar-content">
        {/* Notifications Button */}
        <button className="rui-notification-button" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          {hasNotifications && <span className="rui-notification-badge" />}
        </button>

        {/* Separador vertical */}
        <Separator orientation="vertical" className="h-8" />

        {/* User Profile & Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="rui-user-profile">
              {/* User Info - visible en desktop */}
              <div className="rui-user-info hidden sm:flex">
                <span className="rui-user-name">{getUserDisplayName()}</span>
                <span className="rui-user-role">{formatRoleName(user?.role, t)}</span>
              </div>

              {/* Avatar */}
              <Avatar className="rui-user-avatar">
                {user?.avatar && !imageError && getAvatarUrl(user.avatar) ? (
                  <AvatarImage
                    src={getAvatarUrl(user.avatar)!}
                    alt="Profile"
                    onError={handleImageError}
                  />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitial()}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* User info en móvil */}
            <DropdownMenuLabel className="sm:hidden">
              <div className="flex flex-col">
                <span className="font-medium truncate">
                  {getUserDisplayName()}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {formatRoleName(user?.role, t)}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="sm:hidden" />

            <DropdownMenuItem asChild>
              <a href="/dashboard/profile" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                Mi Perfil
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
