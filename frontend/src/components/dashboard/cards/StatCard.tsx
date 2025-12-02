import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: "blue" | "green" | "red" | "purple" | "yellow" | "orange";
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

const iconColorStyles = {
  blue: {
    backgroundColor: "var(--color-cyan-050)",
    color: "var(--color-cyan-600)",
  },
  green: {
    backgroundColor: "var(--color-green-050)",
    color: "var(--color-green-600)",
  },
  red: {
    backgroundColor: "var(--color-red-100)",
    color: "var(--color-red-600)",
  },
  purple: {
    backgroundColor: "var(--color-cyan-100)",
    color: "var(--color-cyan-700)",
  },
  yellow: {
    backgroundColor: "var(--color-yellow-100)",
    color: "var(--color-yellow-600)",
  },
  orange: {
    backgroundColor: "var(--color-yellow-100)",
    color: "var(--color-yellow-600)",
  },
};

/**
 * StatCard Component
 * Reusable card for displaying statistics with icon and trend
 */
export const StatCard = React.memo<StatCardProps>(({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "blue",
  trend,
}) => {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
      style={{ padding: "var(--space-6)" }}
    >
      <div
        className="flex flex-row items-center justify-between space-y-0"
        style={{ paddingBottom: "var(--space-2)" }}
      >
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center"
          style={iconColorStyles[iconColor]}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div style={{ marginTop: "var(--space-2)" }}>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && (
          <p
            className="text-xs text-gray-500"
            style={{ marginTop: "var(--space-1)" }}
          >
            {description}
          </p>
        )}
        {trend && (
          <div
            className="flex items-center text-xs"
            style={{ marginTop: "var(--space-1)", gap: "var(--space-1)" }}
          >
            <span
              style={{
                color: trend.isPositive
                  ? "var(--color-green-600)"
                  : "var(--color-red-600)"
              }}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
            <span className="text-gray-500">vs mes anterior</span>
          </div>
        )}
      </div>
    </div>
  );
});
