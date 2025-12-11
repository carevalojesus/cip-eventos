import React, { useState } from "react";
import { getInitials, getAvatarColor, type UserLike } from "@/lib/userUtils";

interface UserAvatarProps {
  user: UserLike;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { width: "24px", height: "24px", fontSize: "var(--font-size-xs)" },
  md: { width: "32px", height: "32px", fontSize: "var(--font-size-xs)" },
  lg: { width: "40px", height: "40px", fontSize: "var(--font-size-sm)" },
  xl: { width: "80px", height: "80px", fontSize: "var(--font-size-2xl)" },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  className,
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(user);
  const backgroundColor = getAvatarColor(user.email);
  const dimensions = sizeMap[size];
  const avatarUrl = user.profile?.avatar;

  const containerStyle: React.CSSProperties = {
    width: dimensions.width,
    height: dimensions.height,
    borderRadius: "50%",
    backgroundColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: dimensions.fontSize,
    fontWeight: 600,
    color: "white",
    flexShrink: 0,
    overflow: "hidden",
  };

  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  // Show image if avatar URL exists and hasn't errored
  if (avatarUrl && !imageError) {
    return (
      <div style={containerStyle} className={className}>
        <img
          src={avatarUrl}
          alt={initials}
          style={imageStyle}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div style={containerStyle} className={className}>
      {initials}
    </div>
  );
};

export default UserAvatar;
