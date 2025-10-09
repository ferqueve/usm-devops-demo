import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Calendar } from "lucide-react";

interface DashboardHeaderProps {
  title?: string;
  badge?: string;
  showDateButton?: boolean;
}

export function DashboardHeader({ 
  title = "Dashboard", 
  badge = "Beta",
  showDateButton = true 
}: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">{title}</h1>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </div>
      {showDateButton && (
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Hoy
          </Button>
        </div>
      )}
    </header>
  );
}

