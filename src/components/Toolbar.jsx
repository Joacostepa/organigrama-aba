import { useRef } from 'react';
import { useOrgStore } from '../stores/orgStore';
import { usePeopleStore } from '../stores/peopleStore';
import { exportToJSON, importFromJSON } from '../utils/exportUtils';

function ToolBtn({ onClick, children, title, danger, active, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={title}
      className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${danger ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10' : ''}`}
      style={danger ? {} : {
        color: active ? 'var(--c-text-primary)' : disabled ? 'var(--c-text-faint)' : 'var(--c-text-tertiary)',
        backgroundColor: active ? 'var(--c-bg-active)' : 'transparent',
        cursor: disabled ? 'default' : 'pointer',
      }}
      onMouseEnter={e => { if (!danger && !active && !disabled) { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}}
      onMouseLeave={e => { if (!danger && !active && !disabled) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-tertiary)'; }}}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ zoom, onZoomIn, onZoomOut, onZoomReset, viewMode, onViewModeChange, treeRef, onExportPNG, onExportPDF }) {
  const { tree, expandAll, collapseAll, resetToSeed, importTree, undo, redo, canUndo, canRedo } = useOrgStore();
  const { people, importPeople, resetPeople } = usePeopleStore();
  const fileInputRef = useRef(null);

  const handleExportJSON = () => exportToJSON(tree, people);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromJSON(file);
      importTree(data.organigrama);
      if (data.personas) importPeople(data.personas);
      alert('Datos importados correctamente.');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que querés resetear a la estructura original? Se perderán todos los cambios.')) {
      resetToSeed();
      resetPeople();
    }
  };

  const zoomBtnStyle = { color: 'var(--c-text-tertiary)' };

  return (
    <div className="flex items-center gap-1 px-3 py-2" style={{ backgroundColor: 'var(--c-bg-surface)', borderBottom: '1px solid var(--c-border)' }}>
      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <ToolBtn onClick={undo} title="Deshacer (Ctrl+Z)" disabled={!canUndo()}>↩ Deshacer</ToolBtn>
        <ToolBtn onClick={redo} title="Rehacer (Ctrl+Y)" disabled={!canRedo()}>↪ Rehacer</ToolBtn>
      </div>

      <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--c-border)' }} />

      {/* Expand / Collapse */}
      <div className="flex items-center gap-1">
        <ToolBtn onClick={expandAll} title="Expandir todo">⊞ Expandir</ToolBtn>
        <ToolBtn onClick={collapseAll} title="Colapsar todo">⊟ Colapsar</ToolBtn>
      </div>

      <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--c-border)' }} />

      {/* View mode toggle */}
      <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: 'var(--c-bg-input)' }}>
        <ToolBtn onClick={() => onViewModeChange('list')} title="Vista lista" active={viewMode === 'list'}>≡ Lista</ToolBtn>
        <ToolBtn onClick={() => onViewModeChange('diagram')} title="Vista diagrama" active={viewMode === 'diagram'}>⊞ Diagrama</ToolBtn>
      </div>

      <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--c-border)' }} />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <button onClick={onZoomOut} className="w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-colors" style={zoomBtnStyle} title="Alejar"
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-tertiary)'; }}
        >−</button>
        <button onClick={onZoomReset} className="px-2 py-1 rounded-lg text-xs min-w-[48px] text-center transition-colors" style={{ color: 'var(--c-text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
        >{Math.round(zoom * 100)}%</button>
        <button onClick={onZoomIn} className="w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-colors" style={zoomBtnStyle} title="Acercar"
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-tertiary)'; }}
        >+</button>
      </div>

      <div className="flex-1" />

      {/* Export / Import */}
      <div className="flex items-center gap-1">
        <ToolBtn onClick={handleExportJSON} title="Exportar JSON">↓ JSON</ToolBtn>
        <ToolBtn onClick={onExportPNG} title="Exportar imagen PNG">🖼 PNG</ToolBtn>
        <ToolBtn onClick={onExportPDF} title="Exportar PDF">📄 PDF</ToolBtn>
        <ToolBtn onClick={() => fileInputRef.current?.click()}>↑ Importar</ToolBtn>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--c-border)' }} />
        <ToolBtn onClick={handleReset} danger>↺ Resetear</ToolBtn>
      </div>
    </div>
  );
}
