'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { Plus } from 'lucide-react';
import { NewUserDialog } from './NewUserDialog';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  users: User[];
  currentUserId: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Dueño',
  ADMIN: 'Admin',
  VIEWER: 'Lector',
};

export function UsuariosContent({ users, currentUserId }: Props) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [toggling, setToggling] = useState<User | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggle(user: User) {
    const action = user.isActive ? 'deactivate' : 'activate';
    setLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error al actualizar usuario');
      toast.success(user.isActive ? 'Usuario desactivado' : 'Usuario activado');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setLoadingId(null);
      setToggling(null);
    }
  }

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

      {toggling && (
        <AdminModal
          title={toggling.isActive ? 'Desactivar usuario' : 'Activar usuario'}
          onClose={() => setToggling(null)}
        >
          <p className="text-sm mb-4" style={{ color: 'var(--ps-text-muted)' }}>
            {toggling.isActive
              ? <>¿Desactivar a <strong style={{ color: 'var(--ps-text)' }}>{toggling.username}</strong>? No podrá iniciar sesión hasta que se reactive.</>
              : <>¿Activar a <strong style={{ color: 'var(--ps-text)' }}>{toggling.username}</strong>? Podrá volver a iniciar sesión.</>
            }
          </p>
          <div className="flex gap-3">
            <button onClick={() => setToggling(null)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ border: '1px solid var(--ps-border)', color: 'var(--ps-text-muted)' }}>
              Cancelar
            </button>
            <button
              onClick={() => handleToggle(toggling)}
              disabled={loadingId === toggling.id}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
              style={{
                background: toggling.isActive ? 'var(--ps-red)' : 'var(--ps-green)',
                color: '#fff',
              }}>
              {loadingId === toggling.id ? 'Actualizando…' : toggling.isActive ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </AdminModal>
      )}

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
              <span className="font-medium font-mono" style={{ color: u.isActive ? 'var(--ps-text)' : 'var(--ps-text-muted)' }}>
                {u.username}
              </span>
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
            key: 'isActive', header: 'Estado',
            render: (u) => (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{
                  background: u.isActive ? 'rgba(76,175,125,0.15)' : 'rgba(224,92,92,0.1)',
                  color: u.isActive ? 'var(--ps-green)' : 'var(--ps-red)',
                }}>
                {u.isActive ? 'Activo' : 'Inactivo'}
              </span>
            ),
          },
          {
            key: 'createdAt', header: 'Creado', sortable: true,
            render: (u) => new Date(u.createdAt).toLocaleDateString('es-VE'),
          },
          {
            key: '_actions', header: '',
            render: (u) => {
              const isSelf = u.id === currentUserId;
              return (
                <button
                  disabled={isSelf || loadingId === u.id}
                  onClick={() => setToggling(u)}
                  title={isSelf ? 'No puedes desactivarte a ti mismo' : u.isActive ? 'Desactivar' : 'Activar'}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: u.isActive ? 'rgba(224,92,92,0.1)' : 'rgba(76,175,125,0.15)',
                    color: u.isActive ? 'var(--ps-red)' : 'var(--ps-green)',
                    border: `1px solid ${u.isActive ? 'rgba(224,92,92,0.3)' : 'rgba(76,175,125,0.3)'}`,
                  }}>
                  {loadingId === u.id ? '…' : u.isActive ? 'Desactivar' : 'Activar'}
                </button>
              );
            },
          },
        ]}
      />
    </>
  );
}
