import React from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlaceholderTabProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PlaceholderTab: React.FC<PlaceholderTabProps> = ({
  title,
  description,
  icon: Icon,
}) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
