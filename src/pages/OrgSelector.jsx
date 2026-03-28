import { useState } from 'react';
import { useOrgListStore } from '../stores/orgListStore';
import { useThemeStore } from '../stores/themeStore';

export default function OrgSelector({ onSelect }) {
  const { orgList, loading, createOrg, deleteOrg, updateOrg } = useOrgListStore();
  const { theme, toggleTheme } = useThemeStore();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await createOrg(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowForm(false);
    onSelect(id);
  };

  const handleDelete = async (e, org) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de que querés eliminar "${org.name}"? Se perderán todos los datos.`)) {
      await deleteOrg(org.id);
    }
  };

  const handleRename = async (id) => {
    if (editName.trim() && editName !== orgList.find(o => o.id === id)?.name) {
      await updateOrg(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--c-bg-main)' }}>
      <div className="w-full max-w-lg px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--c-text-primary)' }}>
            Andamios Buenos Aires
          </h1>
          <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>
            Seleccioná un organigrama o creá uno nuevo
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-center text-sm" style={{ color: 'var(--c-text-muted)' }}>Cargando...</p>
        )}

        {/* Org list */}
        {!loading && (
          <div className="space-y-2 mb-4">
            {orgList.length === 0 && !showForm && (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--c-text-faint)' }}>
                No hay organigramas todavía. Creá el primero.
              </p>
            )}
            {orgList.map(org => (
              <div
                key={org.id}
                className="rounded-xl p-4 cursor-pointer transition-all group flex items-center gap-3"
                style={{ backgroundColor: 'var(--c-bg-surface)', border: '1px solid var(--c-border)' }}
                onClick={() => onSelect(org.id)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: 'var(--c-bg-input)', color: 'var(--c-text-muted)' }}
                >
                  ◆
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === org.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => handleRename(org.id)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(org.id); if (e.key === 'Escape') setEditingId(null); }}
                      onClick={e => e.stopPropagation()}
                      className="bg-transparent font-semibold text-sm w-full outline-none"
                      style={{ color: 'var(--c-text-primary)', borderBottom: '1px solid var(--c-border-light)' }}
                    />
                  ) : (
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--c-text-primary)' }}>
                      {org.name}
                    </div>
                  )}
                  {org.description && (
                    <div className="text-xs truncate" style={{ color: 'var(--c-text-muted)' }}>{org.description}</div>
                  )}
                  <div className="text-xs mt-0.5" style={{ color: 'var(--c-text-faint)' }}>
                    Creado: {org.createdAt ? new Date(org.createdAt).toLocaleDateString('es-AR') : '—'}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(org.id); setEditName(org.name); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
                    style={{ color: 'var(--c-text-muted)' }}
                    title="Renombrar"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, org)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create form */}
        {showForm ? (
          <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: 'var(--c-bg-surface)', border: '1px solid var(--c-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-primary)' }}>Nuevo organigrama</h3>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="Nombre (ej: Organigrama Principal)"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: 'var(--c-bg-input)', color: 'var(--c-text-secondary)', border: '1px solid var(--c-border)' }}
            />
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="Descripción (opcional)"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: 'var(--c-bg-input)', color: 'var(--c-text-secondary)', border: '1px solid var(--c-border)' }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowForm(false); setNewName(''); setNewDesc(''); }}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--c-text-tertiary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Crear
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-xl text-sm font-medium border-2 border-dashed transition-colors"
            style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-tertiary)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-border-light)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-tertiary)'; }}
          >
            + Nuevo organigrama
          </button>
        )}

        {/* Theme toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleTheme}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--c-text-muted)' }}
          >
            {theme === 'dark' ? '☀ Modo claro' : '☾ Modo oscuro'}
          </button>
        </div>
      </div>
    </div>
  );
}
