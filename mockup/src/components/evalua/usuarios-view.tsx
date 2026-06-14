'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Mail,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

// Mock users
interface Usuario {
  id: string;
  correo: string;
  rol: 'ADMINISTRADOR' | 'MANTENEDOR';
  createdAt: string;
}

const initialUsuarios: Usuario[] = [
  {
    id: 'usr-001',
    correo: 'admin@evalua.usach.cl',
    rol: 'ADMINISTRADOR',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'usr-002',
    correo: 'maria.gonzalez@usach.cl',
    rol: 'MANTENEDOR',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'usr-003',
    correo: 'carlos.perez@usach.cl',
    rol: 'MANTENEDOR',
    createdAt: '2026-03-15T14:00:00Z',
  },
  {
    id: 'usr-004',
    correo: 'ana.soto@usach.cl',
    rol: 'MANTENEDOR',
    createdAt: '2026-04-20T09:30:00Z',
  },
];

const COLORS = {
  primary: '#EA7600',
  dark: '#394049',
  danger: '#C8102E',
  success: '#198754',
};

export default function UsuariosView() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCorreo, setNewCorreo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Current user is the admin
  const currentUserId = 'usr-001';

  const admins = usuarios.filter(u => u.rol === 'ADMINISTRADOR');
  const mantenedores = usuarios.filter(u => u.rol === 'MANTENEDOR');

  function handleAddMantenedor() {
    if (!newCorreo || !newPassword) return;
    const nuevo: Usuario = {
      id: `usr-${String(usuarios.length + 1).padStart(3, '0')}`,
      correo: newCorreo,
      rol: 'MANTENEDOR',
      createdAt: new Date().toISOString(),
    };
    setUsuarios(prev => [...prev, nuevo]);
    setNewCorreo('');
    setNewPassword('');
    setDialogOpen(false);
  }

  function handleDeleteUser(userId: string) {
    if (userId === currentUserId) return;
    setUsuarios(prev => prev.filter(u => u.id !== userId));
    setDeleteConfirm(null);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: COLORS.dark }}
          >
            Gestión de Usuarios
          </h1>
          <p className="mt-1 text-muted-foreground">
            Administra las cuentas de mantenedores del sistema
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 text-white"
              style={{ backgroundColor: COLORS.primary }}
            >
              <UserPlus className="size-4" />
              Nuevo Mantenedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle style={{ color: COLORS.dark }}>
                Registrar Nuevo Mantenedor
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="mantenedor@usach.cl"
                    className="pl-10"
                    value={newCorreo}
                    onChange={(e) => setNewCorreo(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Contraseña temporal</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  El mantenedor deberá cambiar esta contraseña en su primer ingreso.
                </p>
              </div>
              <Separator />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="text-white"
                  style={{ backgroundColor: COLORS.primary }}
                  onClick={handleAddMantenedor}
                  disabled={!newCorreo || !newPassword}
                >
                  Registrar Mantenedor
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card style={{ backgroundColor: '#fffefd' }}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div
                className="flex size-11 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${COLORS.primary}20`, color: COLORS.primary }}
              >
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.dark }}>{usuarios.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card style={{ backgroundColor: '#fffefd' }}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div
                className="flex size-11 items-center justify-center rounded-lg"
                style={{ backgroundColor: '#fef2f2', color: COLORS.danger }}
              >
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.dark }}>{admins.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card style={{ backgroundColor: '#fffefd' }}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div
                className="flex size-11 items-center justify-center rounded-lg"
                style={{ backgroundColor: '#ecfdf5', color: COLORS.success }}
              >
                <Shield className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mantenedores</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.dark }}>{mantenedores.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Users Table */}
      <Card style={{ backgroundColor: '#fffefd' }}>
        <CardHeader>
          <CardTitle style={{ color: COLORS.dark }}>
            Cuentas de Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {usuarios.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const isConfirmingDelete = deleteConfirm === user.id;

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{
                              backgroundColor: user.rol === 'ADMINISTRADOR' ? COLORS.danger : COLORS.primary,
                            }}
                          >
                            {user.correo.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm" style={{ color: COLORS.dark }}>
                            {user.correo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.rol === 'ADMINISTRADOR' ? (
                          <Badge
                            className="border-0 font-semibold"
                            style={{ backgroundColor: COLORS.danger, color: '#fff' }}
                          >
                            <ShieldAlert className="size-3 mr-1" />
                            ADMINISTRADOR
                          </Badge>
                        ) : (
                          <Badge
                            className="border-0 font-semibold"
                            style={{ backgroundColor: COLORS.primary, color: '#fff' }}
                          >
                            <Shield className="size-3 mr-1" />
                            MANTENEDOR
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground italic">
                            Tu cuenta
                          </span>
                        ) : isConfirmingDelete ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Confirmar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px]"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDeleteConfirm(user.id)}
                          >
                            <Trash2 className="size-3" />
                            Eliminar
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
