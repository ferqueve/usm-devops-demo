import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface StatsListItem {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface StatsListWidgetProps {
  title: string;
  TitleIcon: React.ComponentType<{ className?: string }>;
  items: StatsListItem[] | null;
  loading: boolean;
  /** Number of skeleton rows to show while loading. */
  skeletonRows?: number;
}

/**
 * Generic dashboard widget that renders a vertically stacked list of
 * "label + value" rows inside a Card. Handles its own loading skeleton.
 *
 * If `items` is null and `loading` is false, renders nothing (consumer may
 * want to render a fallback at a higher level).
 */
export default function StatsListWidget({
  title,
  TitleIcon,
  items,
  loading,
  skeletonRows = 4,
}: Readonly<StatsListWidgetProps>) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TitleIcon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: skeletonRows }, (_, i) => i).map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
                <div className="h-6 w-12 bg-secondary rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!items) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TitleIcon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-lg font-semibold">{item.value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
