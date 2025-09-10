import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockReservations } from "@/data/mock-data";
import type { Reservation } from "@/lib/types/dashboard";

// Componente para mostrar el estado de una reserva
function StatusBadge({ status }: { status: Reservation['status'] }) {
  const getStatusConfig = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmada', variant: 'default', color: 'bg-green-100 text-green-800' };
      case 'pending':
        return { label: 'Pendiente', variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' };
      case 'cancelled':
        return { label: 'Cancelada', variant: 'destructive', color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Desconocido', variant: 'outline', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  );
}

// Vista de Gestión de Reservas
export default function Reservations() {
  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Reservas</h2>
          <p className="text-muted-foreground">Administra y crea nuevas reservas de salones</p>
        </div>
        <Button>
          <span className="mr-2">+</span>
          Nueva Reserva
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button variant="outline" size="sm">Todos</Button>
            <Button variant="outline" size="sm">Confirmadas</Button>
            <Button variant="outline" size="sm">Pendientes</Button>
            <Button variant="outline" size="sm">Canceladas</Button>
            <Button variant="outline" size="sm">Hoy</Button>
            <Button variant="outline" size="sm">Esta Semana</Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockReservations.map((reservation) => (
              <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{reservation.roomName.split(' ')[1]}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{reservation.roomName}</h3>
                      <StatusBadge status={reservation.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{reservation.purpose}</p>
                    <p className="text-xs text-muted-foreground">{reservation.userName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{reservation.date}</p>
                  <p className="text-sm text-muted-foreground">{reservation.startTime} - {reservation.endTime}</p>
                  <p className="text-xs text-muted-foreground">{reservation.attendees} personas</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Editar</Button>
                  <Button size="sm" variant="outline">Ver</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">18</div>
            <p className="text-xs text-muted-foreground">75% del total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">4</div>
            <p className="text-xs text-muted-foreground">Requieren aprobación</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">2</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
