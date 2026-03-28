import { useState, useRef, useCallback, useEffect } from 'react';
import { useOrgStore } from '../stores/orgStore';
import { usePeopleStore } from '../stores/peopleStore';
import { searchTree, findNode } from '../utils/treeUtils';
import NodeCard from '../components/NodeCard';
import DetailPanel from '../components/DetailPanel';
import Toolbar from '../components/Toolbar';

export default function OrgChart() {
  const { tree, selectedNodeId, clearSelection, searchQuery, filterArea, filterVacant } = useOrgStore();
  const people = usePeopleStore(s => s.people);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

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

  return (
    <div className="flex flex-col h-full">
      <Toolbar zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onZoomReset={zoomReset} />

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
          className="zoom-container p-8 min-w-max"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div className="max-w-xl">
            <NodeCard node={tree} />
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
