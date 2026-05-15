'use client';

import { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { Plus } from 'lucide-react';
import { NewUserDialog } from './NewUserDialog';

interface User {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

interface Props {
  users: User[];
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Dueño',
  ADMIN: 'Admin',
  VIEWER: 'Lector',
};

export function UsuariosContent({ users }: Props) {
  const [showNew, setShowNew] = useState(false);

  return (
    <>
      <AdminPageHeader
        title="Usuarios"
        subtitle={`${users.length} usuario${users.length !== 1 ? 's' : ''} registrado${users.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => setShowNew(true)} className="btn-gold flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        }
      />

      {showNew && <NewUserDialog onClose={() => setShowNew(false)} />}

      <AdminDataTable
        data={users}
        keyExtractor={(u) => u.id}
        emptyMessage="No hay usuarios registrados"
        searchable
        searchPlaceholder="Buscar por usuario o rol…"
        searchKeys={['username', 'role']}
        columns={[
          {
            key: 'username', header: 'Usuario',
            render: (u) => (
              <span className="font-medium font-mono" style={{ color: 'var(--ps-text)' }}>{u.username}</span>
            ),
          },
          {
            key: 'role', header: 'Rol',
            render: (u) => (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{
                  background: u.role === 'OWNER' ? 'rgba(201,168,76,0.15)' : 'var(--ps-surface)',
                  color: u.role === 'OWNER' ? 'var(--ps-gold)' : 'var(--ps-text-muted)',
                  border: `1px solid ${u.role === 'OWNER' ? 'var(--ps-gold)' : 'var(--ps-border)'}`,
                }}>
                {ROLE_LABELS[u.role] ?? u.role}
              </span>
            ),
          },
          {
            key: 'createdAt', header: 'Creado', sortable: true,
            render: (u) => new Date(u.createdAt).toLocaleDateString('es-VE'),
          },
        ]}
      />
    </>
  );
}
