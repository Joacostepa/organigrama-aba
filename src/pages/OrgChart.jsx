import { useState, useRef, useCallback, useEffect } from 'react';
import { useOrgStore } from '../stores/orgStore';
import { usePeopleStore } from '../stores/peopleStore';
import { useThemeStore } from '../stores/themeStore';
import { searchTree } from '../utils/treeUtils';
import NodeCard from '../components/NodeCard';
import DiagramView from '../components/DiagramView';
import DetailPanel from '../components/DetailPanel';
import Toolbar from '../components/Toolbar';

export default function OrgChart() {
  const { tree, selectedNodeId, clearSelection, searchQuery, expandAll, undo, redo } = useOrgStore();
  const people = usePeopleStore(s => s.people);
  const theme = useThemeStore(s => s.theme);

  // Ctrl+Z / Ctrl+Y keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const [viewMode, setViewMode] = useState('list');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const treeContentRef = useRef(null);

  const zoomIn = () => setZoom(z => Math.min(z + 0.15, 2));
  const zoomOut = () => setZoom(z => Math.max(z - 0.15, 0.3));
  const zoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom(z => Math.min(Math.max(z + delta, 0.3), 2));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e) => {
    if (e.target === containerRef.current || e.target.closest('.zoom-container') === e.target.querySelector('.zoom-container')?.parentElement) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const searchResults = searchQuery ? searchTree(tree, searchQuery) : null;

  // Export helpers
  const handleExportPNG = async () => {
    const el = treeContentRef.current;
    if (!el) return;
    try {
      const { exportToPNG } = await import('../utils/exportImage.js');
      await exportToPNG(el, `organigrama-${new Date().toISOString().slice(0, 10)}.png`, theme);
    } catch (err) {
      console.error(err);
      alert('Error al exportar PNG.');
    }
  };

  const handleExportPDF = async () => {
    const el = treeContentRef.current;
    if (!el) return;
    try {
      const { exportToPDF } = await import('../utils/exportImage.js');
      await exportToPDF(el, `organigrama-${new Date().toISOString().slice(0, 10)}.pdf`, theme);
    } catch (err) {
      console.error(err);
      alert('Error al exportar PDF.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
      />

      {searchQuery && searchResults && (
        <div
          className="px-4 py-1.5 text-xs"
          style={{ color: 'var(--c-text-muted)', backgroundColor: 'var(--c-bg-main)', borderBottom: '1px solid var(--c-border)' }}
        >
          {searchResults.length} resultado(s) para &ldquo;{searchQuery}&rdquo;
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: 'var(--c-bg-main)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === containerRef.current) clearSelection();
        }}
      >
        <div
          className="zoom-container min-w-max"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div ref={treeContentRef}>
            {viewMode === 'list' ? (
              <div className="max-w-xl p-8">
                <NodeCard node={tree} />
              </div>
            ) : (
              <DiagramView tree={tree} />
            )}
          </div>
        </div>
      </div>

      {selectedNodeId && (
        <>
          <div
            className="fixed inset-0 z-30"
            style={{ backgroundColor: 'var(--c-overlay)' }}
            onClick={clearSelection}
          />
          <DetailPanel />
        </>
      )}
    </div>
  );
}
