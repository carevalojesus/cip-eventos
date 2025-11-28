/**
 * Dashboard Types
 * Type definitions for dashboard data structures
 */

export interface DashboardStats {
  activeEvents: number;
  totalRegistered: number;
  monthlyIncome: number;
  ticketsSold: number;
  trends?: {
    activeEvents?: number;
    totalRegistered?: number;
    monthlyIncome?: number;
    ticketsSold?: number;
  };
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  attendees: number;
  status: "published" | "draft" | "completed" | "cancelled";
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target?: string;
  timestamp: string;
}

export interface DashboardData {
  stats: DashboardStats;
  upcomingEvents: UpcomingEvent[];
  recentActivity: Activity[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
