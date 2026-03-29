import { useState, useRef, useEffect } from 'react';
import { useOrgStore } from '../stores/orgStore';
import { usePeopleStore } from '../stores/peopleStore';
import { NODE_TYPES } from '../data/seedData';
import { useDragNode } from '../hooks/useDragNode';

export default function NodeCard({ node, depth = 0, filteredIds }) {
  const {
    selectedNodeId, selectNode, expandedNodes, toggleExpand,
    addChildNode, removeNodeById, updateNodeData
  } = useOrgStore();
  const people = usePeopleStore(s => s.people);
  const [showMenu, setShowMenu] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(node.label);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('puesto');
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);
  const inputRef = useRef(null);
  const addInputRef = useRef(null);

  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children?.length > 0;
  const isSelected = selectedNodeId === node.id;
  const responsables = people.filter(p => p.puestosAsignados.includes(node.id));
  const isVacant = responsables.length === 0;
  const { dragProps, dropProps, isDragging, isDropTarget, draggingNodeId } = useDragNode(node.id);
  const isFiltered = filteredIds && !filteredIds.has(node.id);

  useEffect(() => {
    if (editingLabel && inputRef.current) inputRef.current.focus();
  }, [editingLabel]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !menuBtnRef.current?.contains(e.target)) {
        setShowMenu(false);
      }
    };
    // Use setTimeout so the current click event doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler); };
  }, [showMenu]);

  useEffect(() => {
    if (showAddForm && addInputRef.current) addInputRef.current.focus();
  }, [showAddForm]);

  const openAddForm = () => {
    setNewName('');
    setNewType('puesto');
    setShowAddForm(true);
    setShowMenu(false);
  };

  const handleAddChild = () => {
    if (!newName.trim()) return;
    const typeInfo = NODE_TYPES[newType];
    const newNode = {
      id: `node_${Date.now()}`,
      label: newName.trim(),
      subtitle: '',
      accent: node.accent,
      icon: typeInfo.icon,
      nodeType: newType,
      desc: '',
      noHace: '',
      kpis: [],
      tasks: [],
      note: '',
      responsableId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: []
    };
    addChildNode(node.id, newNode);
    if (!expandedNodes.has(node.id)) toggleExpand(node.id);
    setShowAddForm(false);
    setNewName('');
  };

  const handleDelete = () => {
    if (node.id === 'dg') return;
    if (hasChildren) {
      const choice = confirm(
        `"${node.label}" tiene ${node.children.length} puesto(s) debajo.\n\n` +
        `¿Querés mover los hijos al nivel superior? (Aceptar = mover, Cancelar = eliminar todo)`
      );
      removeNodeById(node.id, choice);
    } else {
      if (confirm(`¿Estás seguro de que querés eliminar "${node.label}"?`)) {
        removeNodeById(node.id, false);
      }
    }
    setShowMenu(false);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setEditingLabel(true);
    setLabelValue(node.label);
  };

  const handleLabelSave = () => {
    if (labelValue.trim() && labelValue !== node.label) {
      updateNodeData(node.id, { label: labelValue.trim() });
    }
    setEditingLabel(false);
  };

  return (
    <div className="relative">
      {/* Connector line from parent */}
      {depth > 0 && (
        <div
          className="absolute top-4 -left-6 w-6 h-px"
          style={{ backgroundColor: 'var(--c-border)' }}
        />
      )}

      {/* Node card */}
      <div
        className={`node-card relative flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer select-none group
          ${isSelected ? 'ring-1' : ''}
          ${isVacant ? 'vacant-border' : ''}
          ${isDragging ? 'dragging' : ''}
          ${isDropTarget ? 'drop-target' : ''}
        `}
        style={{
          borderColor: isDropTarget ? node.accent : isSelected ? node.accent : 'var(--c-border)',
          backgroundColor: isDropTarget ? `${node.accent}25` : isSelected ? `${node.accent}15` : 'var(--c-bg-card)',
          boxShadow: isDropTarget ? `0 0 16px ${node.accent}40` : isSelected ? `0 0 12px ${node.accent}20` : 'none',
          ringColor: node.accent,
          opacity: isFiltered ? 0.15 : isDragging ? 0.4 : draggingNodeId && !isDropTarget ? 0.7 : 1,
        }}
        {...dragProps}
        {...dropProps}
        onClick={(e) => { e.stopPropagation(); selectNode(node.id); }}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(true); }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-xs transition-colors"
            style={{ color: node.accent }}
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        {/* Icon */}
        <span className="text-lg flex-shrink-0" style={{ color: node.accent }}>{node.icon}</span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {editingLabel ? (
            <input
              ref={inputRef}
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleLabelSave}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLabelSave(); if (e.key === 'Escape') setEditingLabel(false); }}
              className="bg-transparent text-sm font-semibold w-full outline-none"
              style={{ borderBottom: '1px solid var(--c-border-light)', color: 'var(--c-text-primary)' }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--c-text-primary)' }}>{node.label}</div>
          )}
          {(node.subtitle || node.nodeType) && (
            <div className="text-xs truncate flex items-center gap-1.5" style={{ color: 'var(--c-text-muted)' }}>
              {node.subtitle}
              {node.nodeType && (
                <span className="px-1.5 py-0 rounded text-[10px] font-medium flex-shrink-0" style={{ backgroundColor: `${node.accent}20`, color: node.accent }}>
                  {NODE_TYPES[node.nodeType]?.label || node.nodeType}
                </span>
              )}
            </div>
          )}
          {responsables.length > 0 && (
            <div className="text-xs mt-0.5 space-y-0.5">
              {responsables.map(p => (
                <div key={p.id} className="truncate" style={{ color: node.accent }}>
                  👤 {p.nombre} {p.apellido}
                </div>
              ))}
            </div>
          )}
          {isVacant && (
            <div className="text-xs italic mt-0.5" style={{ color: 'var(--c-text-faint)' }}>Vacante</div>
          )}
        </div>

        {/* Add child button */}
        <button
          onClick={(e) => { e.stopPropagation(); openAddForm(); }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs transition-all hover:scale-110"
          style={{ backgroundColor: `${node.accent}30`, color: node.accent }}
          title="Agregar hijo"
        >
          +
        </button>

        {/* Menu button */}
        <button
          ref={menuBtnRef}
          onClick={(e) => { e.stopPropagation(); setShowMenu(prev => !prev); }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-all text-xs"
          style={{ color: 'var(--c-text-muted)' }}
        >
          ⋯
        </button>

        {/* Context menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className="context-menu absolute right-0 top-full mt-1 z-50 rounded-lg shadow-xl py-1 min-w-[180px]"
            style={{ backgroundColor: 'var(--c-bg-menu)', border: '1px solid var(--c-border-light)' }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); openAddForm(); }}
              className="w-full text-left px-3 py-2 text-sm"
              style={{ color: 'var(--c-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ＋ Agregar hijo
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); selectNode(node.id); setShowMenu(false); }}
              className="w-full text-left px-3 py-2 text-sm"
              style={{ color: 'var(--c-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ✎ Editar detalle
            </button>
            {node.id !== 'dg' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                ✕ Eliminar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <div
          className="mt-1 ml-6 rounded-lg p-3 space-y-2"
          style={{ backgroundColor: 'var(--c-bg-surface)', border: '1px solid var(--c-border)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex gap-2">
            <input
              ref={addInputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddChild(); if (e.key === 'Escape') setShowAddForm(false); }}
              placeholder="Nombre..."
              className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ backgroundColor: 'var(--c-bg-input)', color: 'var(--c-text-secondary)', border: '1px solid var(--c-border)' }}
            />
          </div>
          <div className="flex gap-1.5">
            {Object.entries(NODE_TYPES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setNewType(key)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                style={{
                  backgroundColor: newType === key ? `${node.accent}25` : 'var(--c-bg-input)',
                  color: newType === key ? node.accent : 'var(--c-text-tertiary)',
                  border: newType === key ? `1px solid ${node.accent}50` : '1px solid var(--c-border)',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 rounded-lg text-xs transition-colors"
              style={{ color: 'var(--c-text-tertiary)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAddChild}
              className="px-3 py-1 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: node.accent }}
            >
              Crear
            </button>
          </div>
        </div>
      )}

      {/* Children */}
      {hasChildren && (
        <div
          className="expand-collapse"
          style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div className="ml-6 mt-1 space-y-1 relative">
              {/* Vertical connector line */}
              <div
                className="absolute top-0 w-px"
                style={{
                  backgroundColor: 'var(--c-border)',
                  height: 'calc(100% - 12px)',
                  left: '-6px'
                }}
              />
              {node.children.map(child => (
                <NodeCard key={child.id} node={child} depth={depth + 1} filteredIds={filteredIds} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
