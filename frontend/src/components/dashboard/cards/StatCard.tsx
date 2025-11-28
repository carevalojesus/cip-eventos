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

const iconColorClasses = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
  yellow: "bg-yellow-100 text-yellow-600",
  orange: "bg-orange-100 text-orange-600",
};

/**
 * StatCard Component
 * Reusable card for displaying statistics with icon and trend
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "blue",
  trend,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center ${iconColorClasses[iconColor]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span
              className={
                trend.isPositive ? "text-green-600" : "text-red-600"
              }
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
            <span className="text-gray-500">vs mes anterior</span>
          </div>
        )}
      </div>
    </div>
  );
};
