/**
 * ProfileSkeleton Component
 *
 * Skeleton de carga para ProfileView.
 */
import React from "react";
import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

export const ProfileSkeleton: React.FC = () => (
    <div className="profile">
        {/* Header Skeleton */}
        <div className="profile__header">
            <div className="profile__header-title">
                <Skeleton width={200} height={28} />
                <Skeleton
                    width={300}
                    height={16}
                    style={{ marginTop: "var(--space-2)" }}
                />
            </div>
        </div>

        {/* User Card Skeleton */}
        <div className="profile__user-card">
            <div className="profile__user-info">
                <SkeletonCircle size={80} />
                <div className="profile__user-details">
                    <Skeleton width={180} height={24} />
                    <Skeleton
                        width={200}
                        height={16}
                        style={{ marginTop: "var(--space-2)" }}
                    />
                </div>
            </div>
        </div>

        {/* Tabs Skeleton */}
        <div
            style={{
                display: "flex",
                gap: "var(--space-4)",
                marginBottom: "var(--space-6)",
                borderBottom: "1px solid var(--color-grey-200)",
                paddingBottom: "var(--space-3)",
            }}
        >
            <Skeleton width={140} height={20} />
            <Skeleton width={100} height={20} />
            <Skeleton width={130} height={20} />
        </div>

        {/* Content Skeleton */}
        <div className="profile__layout">
            <div className="profile__main">
                <div className="profile__card">
                    <Skeleton
                        width={120}
                        height={20}
                        style={{ marginBottom: "var(--space-4)" }}
                    />
                    <div className="profile__form-grid">
                        <div>
                            <Skeleton
                                width="40%"
                                height={14}
                                style={{ marginBottom: "var(--space-2)" }}
                            />
                            <Skeleton
                                width="100%"
                                height={40}
                                style={{ borderRadius: "var(--radius-md)" }}
                            />
                        </div>
                        <div>
                            <Skeleton
                                width="40%"
                                height={14}
                                style={{ marginBottom: "var(--space-2)" }}
                            />
                            <Skeleton
                                width="100%"
                                height={40}
                                style={{ borderRadius: "var(--radius-md)" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="profile__sidebar">
                <div className="profile__sidebar-card">
                    <Skeleton
                        width={100}
                        height={16}
                        style={{ marginBottom: "var(--space-3)" }}
                    />
                    <Skeleton
                        width="100%"
                        height={36}
                        style={{ borderRadius: "var(--radius-md)" }}
                    />
                </div>
            </div>
        </div>
    </div>
);

export default ProfileSkeleton;
