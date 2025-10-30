import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export function SpaceCardSkeleton() {
  return (
    <Card className="h-full border border-gray-200 overflow-hidden">
      {/* Imagen skeleton */}
      <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center">
        <Users className="h-6 w-6 text-gray-300" />
      </div>
      
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Skeleton className="h-4 w-28 flex-1" />
          <Skeleton className="h-5 w-14 flex-shrink-0" />
        </div>

        {/* Capacidad skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4 flex-shrink-0" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Botones skeleton */}
        <div className="flex gap-2 mt-auto">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
