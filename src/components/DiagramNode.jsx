import { useOrgStore } from '../stores/orgStore';
import { usePeopleStore } from '../stores/peopleStore';
import { NODE_TYPES } from '../data/seedData';
import { useDragNode } from '../hooks/useDragNode';

export default function DiagramNode({ node }) {
  const { selectedNodeId, selectNode, expandedNodes, toggleExpand } = useOrgStore();
  const people = usePeopleStore(s => s.people);

  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children?.length > 0;
  const isSelected = selectedNodeId === node.id;
  const responsables = people.filter(p => p.puestosAsignados.includes(node.id));
  const isVacant = responsables.length === 0;
  const { dragProps, dropProps, isDragging, isDropTarget, draggingNodeId } = useDragNode(node.id);

  return (
    <div className="diagram-node flex flex-col items-center">
      {/* Card */}
      <div
        className={`diagram-card relative w-52 px-3 py-2.5 rounded-lg border cursor-pointer select-none transition-all group
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
          opacity: isDragging ? 0.4 : draggingNodeId && !isDropTarget ? 0.7 : 1,
        }}
        {...dragProps}
        {...dropProps}
        onClick={(e) => { e.stopPropagation(); selectNode(node.id); }}
      >
        {/* Top row: icon + label */}
        <div className="flex items-center gap-2">
          <span className="text-base flex-shrink-0" style={{ color: node.accent }}>{node.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--c-text-primary)' }}>{node.label}</div>
          </div>
        </div>

        {/* Subtitle + type badge */}
        {(node.subtitle || node.nodeType) && (
          <div className="text-[10px] truncate flex items-center gap-1 mt-0.5 ml-6" style={{ color: 'var(--c-text-muted)' }}>
            {node.subtitle}
            {node.nodeType && (
              <span className="px-1 rounded text-[9px] font-medium flex-shrink-0" style={{ backgroundColor: `${node.accent}20`, color: node.accent }}>
                {NODE_TYPES[node.nodeType]?.label || node.nodeType}
              </span>
            )}
          </div>
        )}

        {/* Responsables */}
        {responsables.length > 0 && (
          <div className="mt-1 ml-6 space-y-0.5">
            {responsables.slice(0, 2).map(p => (
              <div key={p.id} className="text-[10px] truncate" style={{ color: node.accent }}>
                👤 {p.nombre} {p.apellido}
              </div>
            ))}
            {responsables.length > 2 && (
              <div className="text-[10px]" style={{ color: node.accent }}>+{responsables.length - 2} más</div>
            )}
          </div>
        )}
        {isVacant && (
          <div className="text-[10px] italic mt-1 ml-6" style={{ color: 'var(--c-text-faint)' }}>Vacante</div>
        )}

        {/* Expand toggle for nodes with children */}
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] z-10 transition-colors"
            style={{
              backgroundColor: 'var(--c-bg-surface)',
              border: '1px solid var(--c-border)',
              color: node.accent,
            }}
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && (
        <div
          className="expand-collapse"
          style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div className="diagram-children flex flex-row items-start justify-center gap-2 mt-8 relative">
              {node.children.map(child => (
                <DiagramNode key={child.id} node={child} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
