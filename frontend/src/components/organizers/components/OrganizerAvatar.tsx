import React, { useState } from "react";
import type { Organizer } from "@/services/organizers.service";

interface OrganizerAvatarProps {
    organizer: Organizer;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeMap = {
    sm: { width: "24px", height: "24px", fontSize: "var(--font-size-xs)" },
    md: { width: "32px", height: "32px", fontSize: "var(--font-size-xs)" },
    lg: { width: "40px", height: "40px", fontSize: "var(--font-size-sm)" },
    xl: { width: "80px", height: "80px", fontSize: "var(--font-size-2xl)" },
};

const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name: string): string => {
    const colors = [
        "var(--color-primary)",
        "var(--color-cyan-600)",
        "var(--color-teal-600)",
        "var(--color-green-600)",
        "var(--color-yellow-600)",
        "var(--color-orange-600)",
        "var(--color-red-600)",
        "var(--color-pink-600)",
        "var(--color-purple-600)",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export const OrganizerAvatar: React.FC<OrganizerAvatarProps> = ({
    organizer,
    size = "md",
    className,
}) => {
    const [imageError, setImageError] = useState(false);
    const initials = getInitials(organizer.name);
    const backgroundColor = getAvatarColor(organizer.name);
    const dimensions = sizeMap[size];

    const containerStyle: React.CSSProperties = {
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: "var(--radius-md)",
        backgroundColor: organizer.logoUrl && !imageError ? "white" : backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: dimensions.fontSize,
        fontWeight: 600,
        color: "white",
        flexShrink: 0,
        overflow: "hidden",
        border: organizer.logoUrl && !imageError ? "1px solid var(--color-grey-200)" : "none",
    };

    const imageStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        padding: "2px",
    };

    if (organizer.logoUrl && !imageError) {
        return (
            <div style={containerStyle} className={className}>
                <img
                    src={organizer.logoUrl}
                    alt={organizer.name}
                    style={imageStyle}
                    onError={() => setImageError(true)}
                />
            </div>
        );
    }

    return (
        <div style={containerStyle} className={className}>
            {initials}
        </div>
    );
};

export default OrganizerAvatar;
