import api from "@/lib/api";
import type {
  DashboardStats,
  UpcomingEvent,
  Activity,
  ApiResponse,
} from "@/types/dashboard";

/**
 * Dashboard Service
 * API calls for dashboard data
 */

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<ApiResponse<DashboardStats>>(
        "/dashboard/stats"
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit = 10): Promise<UpcomingEvent[]> {
    try {
      const response = await api.get<ApiResponse<UpcomingEvent[]>>(
        "/dashboard/upcoming-events",
        { params: { limit } }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      throw error;
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 10): Promise<Activity[]> {
    try {
      const response = await api.get<ApiResponse<Activity[]>>(
        "/dashboard/activity",
        { params: { limit } }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      throw error;
    }
  }

  /**
   * Get all dashboard data in one call (optional optimization)
   */
  async getDashboardData() {
    try {
      const [stats, events, activity] = await Promise.all([
        this.getStats(),
        this.getUpcomingEvents(5),
        this.getRecentActivity(5),
      ]);

      return { stats, events, activity };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
