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
  id: number | string;
  title: string;
  date: string;
  attendees: number;
  status: "confirmed" | "pending" | "cancelled";
  capacity?: number;
  location?: string;
}

export interface Activity {
  id: number | string;
  user: string;
  action: string;
  target?: string;
  timestamp: string;
  type?: "payment" | "event" | "update" | "other";
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
