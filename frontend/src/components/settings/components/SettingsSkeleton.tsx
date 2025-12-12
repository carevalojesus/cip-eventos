/**
 * SettingsSkeleton Component
 *
 * Skeleton de carga para SettingsView.
 */
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const SettingsSkeleton: React.FC = () => (
    <div className="settings">
        <div className="settings__header">
            <div className="settings__header-title">
                <Skeleton width={200} height={28} />
                <Skeleton
                    width={300}
                    height={16}
                    style={{ marginTop: "var(--space-2)" }}
                />
            </div>
        </div>

        <div
            style={{
                display: "flex",
                gap: "var(--space-4)",
                marginBottom: "var(--space-6)",
                borderBottom: "1px solid var(--color-grey-200)",
                paddingBottom: "var(--space-3)",
            }}
        >
            <Skeleton width={120} height={20} />
            <Skeleton width={120} height={20} />
            <Skeleton width={100} height={20} />
            <Skeleton width={100} height={20} />
        </div>

        <div className="settings__layout">
            <div className="settings__main">
                <div className="settings__section">
                    <Skeleton
                        width={120}
                        height={20}
                        style={{ marginBottom: "var(--space-4)" }}
                    />
                    <div className="settings__form-grid">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
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
                        ))}
                    </div>
                </div>
            </div>
            <div className="settings__sidebar">
                <div className="settings__sidebar-card">
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

export default SettingsSkeleton;
