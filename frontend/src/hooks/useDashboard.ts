import { useState, useEffect } from "react";
import { dashboardService } from "@/services/dashboard.service";
import type {
  DashboardStats,
  UpcomingEvent,
  Activity,
} from "@/types/dashboard";

/**
 * Hook state interface
 */
interface UseDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * useDashboardStats Hook
 * Fetches and manages dashboard statistics
 */
export function useDashboardStats(): UseDataState<DashboardStats> {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await dashboardService.getStats();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error in useDashboardStats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

/**
 * useUpcomingEvents Hook
 * Fetches and manages upcoming events
 */
export function useUpcomingEvents(
  limit = 5
): UseDataState<UpcomingEvent[]> {
  const [data, setData] = useState<UpcomingEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const events = await dashboardService.getUpcomingEvents(limit);
      setData(events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error in useUpcomingEvents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * useRecentActivity Hook
 * Fetches and manages recent activity
 */
export function useRecentActivity(limit = 5): UseDataState<Activity[]> {
  const [data, setData] = useState<Activity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const activity = await dashboardService.getRecentActivity(limit);
      setData(activity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error in useRecentActivity:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * useDashboardData Hook
 * Fetches all dashboard data at once
 */
export function useDashboardData() {
  const [data, setData] = useState<{
    stats: DashboardStats | null;
    events: UpcomingEvent[] | null;
    activity: Activity[] | null;
  }>({
    stats: null,
    events: null,
    activity: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await dashboardService.getDashboardData();
      setData({
        stats: dashboardData.stats,
        events: dashboardData.events,
        activity: dashboardData.activity,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error in useDashboardData:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}
