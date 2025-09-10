import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardStats } from "@/data/mock-data";
import type { Statistic } from "@/lib/types/dashboard";

// Componente para mostrar estadísticas
function StatCard({ stat }: { stat: Statistic }) {
  const Icon = stat.icon;
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
        <Icon className={`h-4 w-4 ${getTrendColor(stat.trend)}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className="text-xs text-muted-foreground">{stat.change}</p>
      </CardContent>
    </Card>
  );
}

// Vista del Dashboard Principal
export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Próximas reservas */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Próximas Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { room: "Aula 101", time: "09:00 - 11:00", user: "Dr. María García", purpose: "Clase Programación" },
                { room: "Laboratorio 2A", time: "14:00 - 16:00", user: "Ing. Carlos López", purpose: "Práctica Redes" },
                { room: "Auditorio Principal", time: "10:00 - 12:00", user: "Prof. Ana Rodríguez", purpose: "Presentación Proyectos" }
              ].map((reservation, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">{reservation.room}</p>
                      <p className="text-sm text-muted-foreground">{reservation.purpose}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{reservation.time}</p>
                    <p className="text-xs text-muted-foreground">{reservation.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <span className="mr-2">📅</span>
                Nueva Reserva
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <span className="mr-2">🏢</span>
                Ver Salones
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <span className="mr-2">📊</span>
                Ver Estadísticas
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <span className="mr-2">⚙️</span>
                Configuración
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estado de salones */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Estado de Salones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium text-green-600">Disponibles</h4>
                {["Aula 101", "Laboratorio 2A", "Sala de Reuniones 3", "Aula 205"].map((room) => (
                  <div key={room} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{room}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-red-600">Ocupados/Mantenimiento</h4>
                {["Auditorio Principal", "Laboratorio 1B"].map((room) => (
                  <div key={room} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">{room}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
