import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import type {
  DashboardStats,
  UpcomingEvent,
  Activity,
} from "@/types/dashboard";

/**
 * Hook state interface
 * Kept for compatibility, though TanStack Query provides these natively
 */
interface UseDataState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * useDashboardStats Hook
 * Fetches and manages dashboard statistics
 */
export function useDashboardStats(): UseDataState<DashboardStats> {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardService.getStats(),
  });

  return {
    data,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}

/**
 * useUpcomingEvents Hook
 * Fetches and manages upcoming events
 */
export function useUpcomingEvents(limit = 5): UseDataState<UpcomingEvent[]> {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "upcoming-events", limit],
    queryFn: () => dashboardService.getUpcomingEvents(limit),
  });

  return {
    data,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}

/**
 * useRecentActivity Hook
 * Fetches and manages recent activity
 */
export function useRecentActivity(limit = 5): UseDataState<Activity[]> {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "activity", limit],
    queryFn: () => dashboardService.getRecentActivity(limit),
  });

  return {
    data,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}

/**
 * useDashboardData Hook
 * Fetches all dashboard data at once
 */
export function useDashboardData() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "all"],
    queryFn: () => dashboardService.getDashboardData(),
  });

  return {
    data,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
