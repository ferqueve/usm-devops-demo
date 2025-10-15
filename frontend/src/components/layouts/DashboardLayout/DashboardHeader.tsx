import { memo } from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  title?: string;
}

export const DashboardHeader = memo(function DashboardHeader({ 
  title = "Dashboard"
}: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-UY', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b px-4 lg:px-6 shadow-sm" style={{ backgroundColor: '#525961' }}>
      <div className="flex items-center gap-4">
        <SidebarTrigger 
          style={{ color: '#d1d5db' }} 
          className="hover:bg-white/10 transition-all hover:scale-105 rounded-md p-2" 
        />
        <div className="h-6 w-px bg-white/20"></div>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-utec-title" style={{ color: '#d1d5db' }}>
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Badge con hora actual */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
          <Clock className="h-4 w-4" style={{ color: '#d1d5db' }} />
          <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
    </header>
  );
});

