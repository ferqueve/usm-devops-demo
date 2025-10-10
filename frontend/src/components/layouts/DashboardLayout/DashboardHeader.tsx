import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ 
  title = "Dashboard"
}: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b px-4 lg:px-6" style={{ backgroundColor: '#525961' }}>
      <SidebarTrigger style={{ color: '#d1d5db' }} className="hover:bg-white/10" />
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-utec-title" style={{ color: '#d1d5db' }}>{title}</h1>
      </div>
    </header>
  );
}

