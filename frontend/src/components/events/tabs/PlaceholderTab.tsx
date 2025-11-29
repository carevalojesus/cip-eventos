import React from "react";
import { Construction } from "lucide-react";

interface PlaceholderTabProps {
  title: string;
  description: string;
}

export const PlaceholderTab: React.FC<PlaceholderTabProps> = ({
  title,
  description,
}) => {
  return (
    <div className="rui-sidebar-card" style={{ textAlign: "center", padding: "64px 24px" }}>
      <Construction className="rui-metric-icon" style={{ width: 32, height: 32, marginBottom: 16 }} />
      <h3 className="rui-content-section-title" style={{ marginBottom: 8 }}>{title}</h3>
      <p className="rui-sidebar-value-secondary">{description}</p>
    </div>
  );
};
