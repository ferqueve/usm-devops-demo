import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Vista de Configuración del Sistema
export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
        <p className="text-muted-foreground">Ajustes y configuración general</p>
      </div>

      {/* Configuración general */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="institution-name">Nombre de la Institución</Label>
              <input
                id="institution-name"
                type="text"
                defaultValue="UTEC - Universidad Tecnológica"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Zona Horaria</Label>
              <select
                id="timezone"
                defaultValue="America/Lima"
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="America/Lima">Lima (GMT-5)</option>
                <option value="America/New_York">Nueva York (GMT-5)</option>
                <option value="Europe/Madrid">Madrid (GMT+1)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                defaultValue="es"
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-format">Formato de Fecha</Label>
              <select
                id="date-format"
                defaultValue="DD/MM/YYYY"
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Reservas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-duration">Duración Máxima (horas)</Label>
              <input
                id="max-duration"
                type="number"
                defaultValue="4"
                min="1"
                max="24"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advance-booking">Reserva Anticipada (días)</Label>
              <input
                id="advance-booking"
                type="number"
                defaultValue="30"
                min="1"
                max="365"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-attendees">Asistentes Mínimos</Label>
              <input
                id="min-attendees"
                type="number"
                defaultValue="1"
                min="1"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-approval">Aprobación Automática</Label>
              <select
                id="auto-approval"
                defaultValue="false"
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications">Notificaciones por Email</Label>
              <p className="text-sm text-muted-foreground">Recibir confirmaciones por email</p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-notifications">Notificaciones por SMS</Label>
              <p className="text-sm text-muted-foreground">Recibir recordatorios por SMS</p>
            </div>
            <Switch id="sms-notifications" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications">Notificaciones Push</Label>
              <p className="text-sm text-muted-foreground">Notificaciones en tiempo real</p>
            </div>
            <Switch id="push-notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance-alerts">Alertas de Mantenimiento</Label>
              <p className="text-sm text-muted-foreground">Notificar sobre salones en mantenimiento</p>
            </div>
            <Switch id="maintenance-alerts" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Permisos y roles */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos y Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="font-medium">Administrador</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="admin-reservations" defaultChecked disabled />
                    <Label htmlFor="admin-reservations" className="text-sm">Gestionar Reservas</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="admin-rooms" defaultChecked disabled />
                    <Label htmlFor="admin-rooms" className="text-sm">Gestionar Salones</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="admin-users" defaultChecked disabled />
                    <Label htmlFor="admin-users" className="text-sm">Gestionar Usuarios</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="admin-reports" defaultChecked disabled />
                    <Label htmlFor="admin-reports" className="text-sm">Generar Reportes</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Profesor</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="prof-reservations" defaultChecked />
                    <Label htmlFor="prof-reservations" className="text-sm">Crear Reservas</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="prof-view-rooms" defaultChecked />
                    <Label htmlFor="prof-view-rooms" className="text-sm">Ver Salones</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="prof-reports" />
                    <Label htmlFor="prof-reports" className="text-sm">Ver Reportes</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Estudiante</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="student-reservations" />
                    <Label htmlFor="student-reservations" className="text-sm">Crear Reservas</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="student-view-rooms" defaultChecked />
                    <Label htmlFor="student-view-rooms" className="text-sm">Ver Salones</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="student-reports" />
                    <Label htmlFor="student-reports" className="text-sm">Ver Reportes</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-4">
        <Button>Guardar Cambios</Button>
        <Button variant="outline">Restaurar Valores</Button>
        <Button variant="outline">Exportar Configuración</Button>
      </div>
    </div>
  );
}
