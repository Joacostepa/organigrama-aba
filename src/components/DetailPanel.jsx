import { useState, useEffect } from 'react';
import { useOrgStore } from '../stores/orgStore';
import { usePeopleStore } from '../stores/peopleStore';
import { findNode, getAllNodes } from '../utils/treeUtils';
import { NODE_TYPES } from '../data/seedData';

export default function DetailPanel() {
  const { tree, selectedNodeId, clearSelection, updateNodeData, moveNodeTo } = useOrgStore();
  const { people, assignToNode, unassignFromNode } = usePeopleStore();

  const node = selectedNodeId ? findNode(tree, selectedNodeId) : null;

  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newNoHaceItem, setNewNoHaceItem] = useState('');
  const [newKpi, setNewKpi] = useState('');
  const [showMoveSelector, setShowMoveSelector] = useState(false);
  const [showPersonSelector, setShowPersonSelector] = useState(false);

  useEffect(() => {
    setEditField(null);
    setShowMoveSelector(false);
    setShowPersonSelector(false);
  }, [selectedNodeId]);

  if (!node) return null;

  const assignedPeople = people.filter(p => p.puestosAsignados.includes(node.id));
  const allNodes = getAllNodes(tree).filter(n => n.id !== node.id);

  const startEdit = (field, value) => {
    setEditField(field);
    setTempValue(value || '');
  };

  const saveEdit = (field) => {
    updateNodeData(node.id, { [field]: tempValue });
    setEditField(null);
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    updateNodeData(node.id, { tasks: [...(node.tasks || []), newTask.trim()] });
    setNewTask('');
  };

  const handleRemoveTask = (idx) => {
    const updated = [...(node.tasks || [])];
    updated.splice(idx, 1);
    updateNodeData(node.id, { tasks: updated });
  };

  const handleMoveTask = (idx, dir) => {
    const updated = [...(node.tasks || [])];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= updated.length) return;
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    updateNodeData(node.id, { tasks: updated });
  };

  const handleAddKpi = () => {
    if (!newKpi.trim()) return;
    updateNodeData(node.id, { kpis: [...(node.kpis || []), newKpi.trim()] });
    setNewKpi('');
  };

  const handleRemoveKpi = (idx) => {
    const updated = [...(node.kpis || [])];
    updated.splice(idx, 1);
    updateNodeData(node.id, { kpis: updated });
  };

  const handleAssignPerson = (personId) => {
    assignToNode(personId, node.id);
    updateNodeData(node.id, { responsableId: personId });
    setShowPersonSelector(false);
  };

  const handleUnassignPerson = (personId) => {
    unassignFromNode(personId, node.id);
    const remaining = assignedPeople.filter(p => p.id !== personId);
    updateNodeData(node.id, { responsableId: remaining.length ? remaining[0].id : null });
  };

  const handleMoveTo = (newParentId) => {
    moveNodeTo(node.id, newParentId);
    setShowMoveSelector(false);
  };

  const noHaceItems = node.noHace
    ? node.noHace.split(/\.\s+|[\n]/).filter(s => s.trim())
    : [];

  const inputStyle = {
    backgroundColor: 'var(--c-bg-input)',
    color: 'var(--c-text-secondary)',
    border: '1px solid var(--c-border)',
  };

  return (
    <div
      className="detail-panel fixed right-0 top-0 h-full w-[420px] max-w-[90vw] z-40 overflow-y-auto shadow-2xl"
      style={{ backgroundColor: 'var(--c-bg-surface)', borderLeft: '1px solid var(--c-border)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 px-5 py-4 flex items-center gap-3 z-10"
        style={{ backgroundColor: 'var(--c-bg-surface)', borderBottom: '1px solid var(--c-border)' }}
      >
        <span className="text-2xl" style={{ color: node.accent }}>{node.icon}</span>
        <div className="flex-1 min-w-0">
          {editField === 'label' ? (
            <input
              autoFocus
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={() => saveEdit('label')}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit('label'); if (e.key === 'Escape') setEditField(null); }}
              className="bg-transparent font-bold text-lg w-full outline-none"
              style={{ borderBottom: '1px solid var(--c-border-light)', color: 'var(--c-text-primary)' }}
            />
          ) : (
            <h2
              className="text-lg font-bold truncate cursor-pointer hover:underline decoration-dotted"
              style={{ color: 'var(--c-text-primary)' }}
              onClick={() => startEdit('label', node.label)}
            >
              {node.label}
            </h2>
          )}
          {editField === 'subtitle' ? (
            <input
              autoFocus
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={() => saveEdit('subtitle')}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit('subtitle'); if (e.key === 'Escape') setEditField(null); }}
              className="bg-transparent text-sm w-full outline-none"
              style={{ borderBottom: '1px solid var(--c-border-light)', color: 'var(--c-text-tertiary)' }}
            />
          ) : (
            <p
              className="text-sm truncate cursor-pointer hover:underline decoration-dotted"
              style={{ color: 'var(--c-text-tertiary)' }}
              onClick={() => startEdit('subtitle', node.subtitle)}
            >
              {node.subtitle || 'Sin subtítulo'}
            </p>
          )}
        </div>
        <button
          onClick={clearSelection}
          className="text-xl w-8 h-8 flex items-center justify-center rounded transition-colors"
          style={{ color: 'var(--c-text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
        >
          ×
        </button>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Area color */}
        <div>
          <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Color del Área</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={node.accent}
              onChange={e => updateNodeData(node.id, { accent: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-sm" style={{ color: 'var(--c-text-tertiary)' }}>{node.accent}</span>
          </div>
        </div>

        {/* Tipo de nodo */}
        <div>
          <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Tipo</label>
          <div className="flex gap-1.5 mt-1.5">
            {Object.entries(NODE_TYPES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => updateNodeData(node.id, { nodeType: key, icon: t.icon })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                style={{
                  backgroundColor: node.nodeType === key ? `${node.accent}25` : 'var(--c-bg-input)',
                  color: node.nodeType === key ? node.accent : 'var(--c-text-tertiary)',
                  border: node.nodeType === key ? `1px solid ${node.accent}50` : '1px solid var(--c-border)',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Responsables */}
        <div>
          <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Responsable(s)</label>
          <div className="mt-2 space-y-2">
            {assignedPeople.map(p => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--c-bg-input)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: 'var(--c-avatar-from)', color: 'var(--c-text-primary)' }}>
                  {p.nombre[0]}{p.apellido[0]}
                </div>
                <span className="text-sm flex-1 truncate" style={{ color: 'var(--c-text-secondary)' }}>{p.nombre} {p.apellido}</span>
                <button
                  onClick={() => handleUnassignPerson(p.id)}
                  className="text-sm hover:text-red-400"
                  style={{ color: 'var(--c-text-faint)' }}
                >
                  ✕
                </button>
              </div>
            ))}
            {assignedPeople.length === 0 && (
              <p className="text-sm italic" style={{ color: 'var(--c-text-faint)' }}>Sin responsable asignado</p>
            )}
            <button
              onClick={() => setShowPersonSelector(!showPersonSelector)}
              className="text-sm px-3 py-1.5 rounded-lg border border-dashed w-full transition-colors"
              style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-tertiary)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-border-light)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-tertiary)'; }}
            >
              + Asignar persona
            </button>
            {showPersonSelector && (
              <div className="rounded-lg max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--c-bg-input)', border: '1px solid var(--c-border)' }}>
                {people.filter(p => !p.puestosAsignados.includes(node.id)).length === 0 ? (
                  <p className="text-sm p-3" style={{ color: 'var(--c-text-muted)' }}>No hay personas disponibles. Cargalas en la sección Equipo.</p>
                ) : (
                  people.filter(p => !p.puestosAsignados.includes(node.id)).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAssignPerson(p.id)}
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
                      style={{ color: 'var(--c-text-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: 'var(--c-avatar-from)', color: 'var(--c-text-primary)' }}>
                        {p.nombre[0]}{p.apellido?.[0] || ''}
                      </span>
                      {p.nombre} {p.apellido}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Descripción del Rol</label>
          {editField === 'desc' ? (
            <textarea
              autoFocus
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={() => saveEdit('desc')}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none min-h-[80px] resize-y"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
            />
          ) : (
            <p
              className="mt-1 text-sm cursor-pointer rounded-lg px-3 py-2 min-h-[40px]"
              style={{ color: 'var(--c-text-tertiary)', backgroundColor: 'var(--c-bg-input)' }}
              onClick={() => startEdit('desc', node.desc)}
            >
              {node.desc || 'Click para agregar descripción...'}
            </p>
          )}
        </div>

        {/* Tareas */}
        <div>
          <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>
            Tareas / Funciones ({(node.tasks || []).length})
          </label>
          <div className="mt-2 space-y-1">
            {(node.tasks || []).map((task, idx) => (
              <div key={idx} className="flex items-center gap-1 group rounded px-2 py-1.5" style={{ backgroundColor: 'var(--c-bg-input)' }}>
                <span className="text-sm flex-1" style={{ color: 'var(--c-text-secondary)' }}>{task}</span>
                <button onClick={() => handleMoveTask(idx, -1)} className="opacity-0 group-hover:opacity-100 text-xs px-1" style={{ color: 'var(--c-text-faint)' }}>↑</button>
                <button onClick={() => handleMoveTask(idx, 1)} className="opacity-0 group-hover:opacity-100 text-xs px-1" style={{ color: 'var(--c-text-faint)' }}>↓</button>
                <button onClick={() => handleRemoveTask(idx)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-xs px-1" style={{ color: 'var(--c-text-faint)' }}>✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
              placeholder="Nueva tarea..."
              className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
            />
            <button
              onClick={handleAddTask}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: `${node.accent}30`, color: node.accent }}
            >
              +
            </button>
          </div>
        </div>

        {/* Qué NO debe hacer */}
        <div>
          <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Qué NO debe hacer</label>
          {editField === 'noHace' ? (
            <textarea
              autoFocus
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={() => saveEdit('noHace')}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none min-h-[60px] resize-y"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
            />
          ) : (
            <div
              className="mt-1 cursor-pointer rounded-lg px-3 py-2 min-h-[40px]"
              style={{ backgroundColor: 'var(--c-bg-input)' }}
              onClick={() => startEdit('noHace', node.noHace)}
            >
              {noHaceItems.length > 0 ? (
                <ul className="space-y-1">
                  {noHaceItems.map((item, i) => (
                    <li key={i} className="text-sm text-red-400/70 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: 'var(--c-text-faint)' }}>Click para agregar...</p>
              )}
            </div>
          )}
        </div>

        {/* KPIs */}
        <div>
          <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>KPIs</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(node.kpis || []).map((kpi, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${node.accent}20`, color: node.accent }}
              >
                {kpi}
                <button onClick={() => handleRemoveKpi(idx)} className="hover:opacity-70 ml-1">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={newKpi}
              onChange={e => setNewKpi(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddKpi(); }}
              placeholder="Nuevo KPI..."
              className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
            />
            <button onClick={handleAddKpi} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ backgroundColor: `${node.accent}30`, color: node.accent }}>+</button>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Notas Internas</label>
          {editField === 'note' ? (
            <textarea
              autoFocus
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={() => saveEdit('note')}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none min-h-[60px] resize-y"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
            />
          ) : (
            <p
              className="mt-1 text-sm text-yellow-400/60 cursor-pointer rounded-lg px-3 py-2 min-h-[40px]"
              style={{ backgroundColor: 'var(--c-bg-input)' }}
              onClick={() => startEdit('note', node.note)}
            >
              {node.note || 'Click para agregar notas...'}
            </p>
          )}
        </div>

        {/* Mover nodo */}
        {node.id !== 'dg' && (
          <div>
            <button
              onClick={() => setShowMoveSelector(!showMoveSelector)}
              className="text-sm rounded-lg px-3 py-2 w-full text-left transition-colors"
              style={{ color: 'var(--c-text-tertiary)', border: '1px solid var(--c-border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-border-light)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-tertiary)'; }}
            >
              📂 Mover a otro padre...
            </button>
            {showMoveSelector && (
              <div className="mt-2 rounded-lg max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--c-bg-input)', border: '1px solid var(--c-border)' }}>
                {allNodes.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleMoveTo(n.id)}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
                    style={{ color: 'var(--c-text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ color: n.accent }}>{n.icon}</span>
                    {n.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
          <p className="text-xs" style={{ color: 'var(--c-text-faint)' }}>
            Creado: {node.createdAt ? new Date(node.createdAt).toLocaleDateString('es-AR') : '—'}
          </p>
          <p className="text-xs" style={{ color: 'var(--c-text-faint)' }}>
            Modificado: {node.updatedAt ? new Date(node.updatedAt).toLocaleDateString('es-AR') : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
