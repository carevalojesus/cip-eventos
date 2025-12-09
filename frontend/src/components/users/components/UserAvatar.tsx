import React from "react";
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
  const initials = getInitials(user);
  const backgroundColor = getAvatarColor(user.email);
  const dimensions = sizeMap[size];

  const style: React.CSSProperties = {
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
  };

  return (
    <div style={style} className={className}>
      {initials}
    </div>
  );
};

export default UserAvatar;
