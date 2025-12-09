import React from "react";

interface ActivityItemProps {
  user: string;
  action: string;
  target?: string;
  timestamp: string;
}

/**
 * ActivityItem Component
 * Reusable component for displaying activity feed items
 */
export const ActivityItem = React.memo<ActivityItemProps>(({
  user,
  action,
  target,
  timestamp,
}) => {
  return (
    <div className="flex flex-col space-y-1 py-3">
      <p className="text-sm text-grey-900">
        <span className="font-medium">{user}</span> {action}{" "}
        {target && <span className="font-medium">{target}</span>}
      </p>
      <p className="text-xs text-grey-500">{timestamp}</p>
    </div>
  );
});
