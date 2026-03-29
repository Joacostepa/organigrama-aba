import { create } from 'zustand';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { seedOrgData } from '../data/seedData';
import { updateNode, addChild, removeNode, moveNode } from '../utils/treeUtils';

const MAX_HISTORY = 30;

function cacheKey(orgId) { return `aba-org-${orgId}`; }

function loadFromCache(orgId) {
  try {
    const data = localStorage.getItem(cacheKey(orgId));
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveToCache(orgId, data) {
  localStorage.setItem(cacheKey(orgId), JSON.stringify(data));
}

export const useOrgStore = create((set, get) => ({
  tree: structuredClone(seedOrgData),
  selectedNodeId: null,
  expandedNodes: new Set(['dg', 'tec_com', 'ops', 'deposito', 'admin', 'sistemas']),
  searchQuery: '',
  filterArea: null,
  filterType: null,
  filterVacant: false,
  _currentOrgId: null,
  _unsubscribe: null,
  _skipNextSnapshot: false,
  draggingNodeId: null,
  dropTargetId: null,
  setDragging: (id) => set({ draggingNodeId: id }),
  setDropTarget: (id) => set({ dropTargetId: id }),
  clearDragState: () => set({ draggingNodeId: null, dropTargetId: null }),

  // Undo/Redo
  _undoStack: [],
  _redoStack: [],

  _pushUndo: () => {
    const { tree, _undoStack } = get();
    const snapshot = JSON.stringify(tree);
    const newStack = [..._undoStack, snapshot].slice(-MAX_HISTORY);
    set({ _undoStack: newStack, _redoStack: [] });
  },

  undo: () => {
    const { _undoStack, tree } = get();
    if (_undoStack.length === 0) return;
    const newUndo = [..._undoStack];
    const prev = newUndo.pop();
    const prevTree = JSON.parse(prev);
    const currentSnapshot = JSON.stringify(tree);
    set({
      _undoStack: newUndo,
      _redoStack: [...get()._redoStack, currentSnapshot],
      tree: prevTree,
      _skipNextSnapshot: true,
    });
    get()._save(prevTree);
  },

  redo: () => {
    const { _redoStack, tree } = get();
    if (_redoStack.length === 0) return;
    const newRedo = [..._redoStack];
    const next = newRedo.pop();
    const nextTree = JSON.parse(next);
    const currentSnapshot = JSON.stringify(tree);
    set({
      _redoStack: newRedo,
      _undoStack: [...get()._undoStack, currentSnapshot],
      tree: nextTree,
      _skipNextSnapshot: true,
    });
    get()._save(nextTree);
  },

  canUndo: () => get()._undoStack.length > 0,
  canRedo: () => get()._redoStack.length > 0,

  loadOrg: (orgId) => {
    const { _unsubscribe, _currentOrgId } = get();
    if (_currentOrgId === orgId) return;

    if (_unsubscribe) _unsubscribe();

    const cached = loadFromCache(orgId);
    set({
      tree: cached || structuredClone(seedOrgData),
      selectedNodeId: null,
      _currentOrgId: orgId,
      _undoStack: [],
      _redoStack: [],
      searchQuery: '',
      filterArea: null,
      filterVacant: false,
      expandedNodes: new Set(['dg']),
    });

    const docRef = doc(db, 'organigramas', orgId, 'data', 'tree');
    const unsub = onSnapshot(docRef, (snap) => {
      if (get()._skipNextSnapshot) {
        set({ _skipNextSnapshot: false });
        return;
      }
      if (snap.exists()) {
        try {
          const tree = JSON.parse(snap.data().data);
          saveToCache(orgId, tree);
          if (get()._currentOrgId === orgId) {
            set({ tree });
          }
        } catch (err) {
          console.error('Error parseando árbol:', err);
        }
      } else {
        const seed = structuredClone(seedOrgData);
        setDoc(docRef, { data: JSON.stringify(seed) });
        saveToCache(orgId, seed);
        if (get()._currentOrgId === orgId) {
          set({ tree: seed });
        }
      }
    });

    set({ _unsubscribe: unsub });
  },

  unloadOrg: () => {
    const { _unsubscribe } = get();
    if (_unsubscribe) _unsubscribe();
    set({ _currentOrgId: null, _unsubscribe: null, selectedNodeId: null, _undoStack: [], _redoStack: [] });
  },

  _save: (tree) => {
    const orgId = get()._currentOrgId;
    if (!orgId) return;
    saveToCache(orgId, tree);
    const docRef = doc(db, 'organigramas', orgId, 'data', 'tree');
    setDoc(docRef, { data: JSON.stringify(tree) }).catch(err =>
      console.error('Error guardando árbol:', err)
    );
  },

  _saveWithUndo: (newTree, extraState = {}) => {
    get()._pushUndo();
    get()._save(newTree);
    set({ tree: newTree, ...extraState });
  },

  setTree: (tree) => {
    get()._saveWithUndo(tree);
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  clearSelection: () => set({ selectedNodeId: null }),

  toggleExpand: (id) => set((state) => {
    const next = new Set(state.expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { expandedNodes: next };
  }),

  expandAll: () => {
    const { tree } = get();
    const ids = new Set();
    const collect = (node) => {
      if (node.children?.length) {
        ids.add(node.id);
        node.children.forEach(collect);
      }
    };
    collect(tree);
    set({ expandedNodes: ids });
  },

  collapseAll: () => set({ expandedNodes: new Set(['dg']) }),

  updateNodeData: (id, updates) => {
    const newTree = updateNode(get().tree, id, updates);
    get()._saveWithUndo(newTree);
  },

  addChildNode: (parentId, newNode) => {
    const newTree = addChild(get().tree, parentId, newNode);
    get()._saveWithUndo(newTree);
  },

  removeNodeById: (id, reparent = false) => {
    const newTree = removeNode(get().tree, id, reparent);
    get()._saveWithUndo(newTree, { selectedNodeId: null });
  },

  moveNodeTo: (nodeId, newParentId) => {
    const newTree = moveNode(get().tree, nodeId, newParentId);
    get()._saveWithUndo(newTree);
  },

  resetToSeed: () => {
    get()._pushUndo();
    const fresh = structuredClone(seedOrgData);
    get()._save(fresh);
    set({ tree: fresh, selectedNodeId: null });
  },

  importTree: (tree) => {
    get()._pushUndo();
    get()._save(tree);
    set({ tree, selectedNodeId: null });
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterArea: (area) => set({ filterArea: area }),
  setFilterType: (type) => set({ filterType: type }),
  setFilterVacant: (v) => set({ filterVacant: v }),
}));
