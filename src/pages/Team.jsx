import { useState } from 'react';
import { usePeopleStore } from '../stores/peopleStore';
import { useOrgStore } from '../stores/orgStore';
import { findNode } from '../utils/treeUtils';

function PersonForm({ person, onSave, onCancel }) {
  const [form, setForm] = useState({
    nombre: person?.nombre || '',
    apellido: person?.apellido || '',
    email: person?.email || '',
    telefono: person?.telefono || '',
    fotoUrl: person?.fotoUrl || '',
    fechaIngreso: person?.fechaIngreso || '',
    notas: person?.notas || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim()) {
      alert('Nombre y apellido son obligatorios.');
      return;
    }
    onSave(form);
  };

  const inputStyle = {
    backgroundColor: 'var(--c-bg-input)',
    color: 'var(--c-text-secondary)',
    border: '1px solid var(--c-border)',
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>{label}</label>
      {key === 'notas' ? (
        <textarea
          value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none resize-y min-h-[60px]"
          style={inputStyle}
          placeholder={placeholder}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={inputStyle}
          placeholder={placeholder}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
        />
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field('Nombre *', 'nombre', 'text', 'Juan')}
        {field('Apellido *', 'apellido', 'text', 'Pérez')}
      </div>
      {field('Email', 'email', 'email', 'juan@aba.com')}
      {field('Teléfono', 'telefono', 'tel', '+54 11 1234-5678')}
      {field('URL de foto', 'fotoUrl', 'url', 'https://...')}
      {field('Fecha de ingreso', 'fechaIngreso', 'date')}
      {field('Notas', 'notas', 'text', 'Notas adicionales...')}
      <div className="flex gap-2 pt-2">
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors">
          {person ? 'Guardar' : 'Agregar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--c-text-tertiary)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-tertiary)'; }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function Team() {
  const { people, addPerson, updatePerson, removePerson } = usePeopleStore();
  const tree = useOrgStore(s => s.tree);
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = people.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !q || `${p.nombre} ${p.apellido} ${p.email || ''}`.toLowerCase().includes(q);
    const matchesFilter = filter === 'all' ||
      (filter === 'assigned' && p.puestosAsignados.length > 0) ||
      (filter === 'unassigned' && p.puestosAsignados.length === 0);
    return matchesSearch && matchesFilter;
  });

  const handleAdd = (data) => { addPerson(data); setShowForm(false); };
  const handleEdit = (data) => { updatePerson(editingPerson.id, data); setEditingPerson(null); };
  const handleDelete = (person) => {
    if (confirm(`¿Estás seguro de que querés eliminar a ${person.nombre} ${person.apellido}?`)) {
      removePerson(person.id);
    }
  };

  const getNodeLabel = (nodeId) => {
    const node = findNode(tree, nodeId);
    return node ? node.label : nodeId;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text-primary)' }}>Equipo</h1>
            <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>{people.length} persona(s) cargada(s)</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingPerson(null); }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            + Nueva persona
          </button>
        </div>

        {/* Form */}
        {(showForm || editingPerson) && (
          <div className="mb-6 rounded-xl p-5" style={{ backgroundColor: 'var(--c-bg-surface)', border: '1px solid var(--c-border)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--c-text-primary)' }}>
              {editingPerson ? `Editando: ${editingPerson.nombre} ${editingPerson.apellido}` : 'Nueva persona'}
            </h3>
            <PersonForm
              person={editingPerson}
              onSave={editingPerson ? handleEdit : handleAdd}
              onCancel={() => { setShowForm(false); setEditingPerson(null); }}
            />
          </div>
        )}

        {/* Search & filters */}
        <div className="flex gap-3 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email..."
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: 'var(--c-bg-surface)', color: 'var(--c-text-secondary)', border: '1px solid var(--c-border)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: 'var(--c-bg-surface)', color: 'var(--c-text-secondary)', border: '1px solid var(--c-border)' }}
          >
            <option value="all">Todas</option>
            <option value="assigned">Con puesto</option>
            <option value="unassigned">Sin puesto</option>
          </select>
        </div>

        {/* People list */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-center py-12" style={{ color: 'var(--c-text-faint)' }}>
              {people.length === 0 ? 'No hay personas cargadas. Agregá la primera.' : 'Sin resultados.'}
            </p>
          )}
          {filtered.map(person => (
            <div
              key={person.id}
              className="rounded-xl p-4 flex items-center gap-4 transition-colors group"
              style={{ backgroundColor: 'var(--c-bg-surface)', border: '1px solid var(--c-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 overflow-hidden"
                style={{ background: `linear-gradient(135deg, var(--c-avatar-from), var(--c-avatar-to))`, color: 'var(--c-text-primary)' }}
              >
                {person.fotoUrl ? (
                  <img src={person.fotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  `${person.nombre[0]}${person.apellido?.[0] || ''}`
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: 'var(--c-text-primary)' }}>{person.nombre} {person.apellido}</div>
                <div className="text-xs flex flex-wrap gap-x-3" style={{ color: 'var(--c-text-muted)' }}>
                  {person.email && <span>{person.email}</span>}
                  {person.telefono && <span>{person.telefono}</span>}
                  {person.fechaIngreso && <span>Ingreso: {new Date(person.fechaIngreso).toLocaleDateString('es-AR')}</span>}
                </div>
                {person.puestosAsignados.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {person.puestosAsignados.map(nodeId => (
                      <span key={nodeId} className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        {getNodeLabel(nodeId)}
                      </span>
                    ))}
                  </div>
                )}
                {person.puestosAsignados.length === 0 && (
                  <span className="text-xs text-yellow-500/70 italic mt-1 inline-block">Sin puesto asignado</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingPerson(person); setShowForm(false); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
                  style={{ color: 'var(--c-text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(person)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
