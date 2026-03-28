import { create } from 'zustand';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { seedOrgData } from '../data/seedData';
import { updateNode, addChild, removeNode, moveNode } from '../utils/treeUtils';

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
  filterVacant: false,
  _currentOrgId: null,
  _unsubscribe: null,
  draggingNodeId: null,
  dropTargetId: null,
  setDragging: (id) => set({ draggingNodeId: id }),
  setDropTarget: (id) => set({ dropTargetId: id }),
  clearDragState: () => set({ draggingNodeId: null, dropTargetId: null }),

  loadOrg: (orgId) => {
    const { _unsubscribe, _currentOrgId } = get();
    if (_currentOrgId === orgId) return;

    // Cleanup previous listener
    if (_unsubscribe) _unsubscribe();

    // Load from cache immediately
    const cached = loadFromCache(orgId);
    set({
      tree: cached || structuredClone(seedOrgData),
      selectedNodeId: null,
      _currentOrgId: orgId,
      searchQuery: '',
      filterArea: null,
      filterVacant: false,
      expandedNodes: new Set(['dg']),
    });

    // Start Firestore listener
    const docRef = doc(db, 'organigramas', orgId, 'data', 'tree');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        try {
          const tree = JSON.parse(snap.data().data);
          saveToCache(orgId, tree);
          // Only update if we're still on the same org
          if (get()._currentOrgId === orgId) {
            set({ tree });
          }
        } catch (err) {
          console.error('Error parseando árbol:', err);
        }
      } else {
        // First time: push seed data
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
    set({ _currentOrgId: null, _unsubscribe: null, selectedNodeId: null });
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

  setTree: (tree) => {
    get()._save(tree);
    set({ tree });
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
    get()._save(newTree);
    set({ tree: newTree });
  },

  addChildNode: (parentId, newNode) => {
    const newTree = addChild(get().tree, parentId, newNode);
    get()._save(newTree);
    set({ tree: newTree });
  },

  removeNodeById: (id, reparent = false) => {
    const newTree = removeNode(get().tree, id, reparent);
    get()._save(newTree);
    set({ tree: newTree, selectedNodeId: null });
  },

  moveNodeTo: (nodeId, newParentId) => {
    const newTree = moveNode(get().tree, nodeId, newParentId);
    get()._save(newTree);
    set({ tree: newTree });
  },

  resetToSeed: () => {
    const fresh = structuredClone(seedOrgData);
    get()._save(fresh);
    set({ tree: fresh, selectedNodeId: null });
  },

  importTree: (tree) => {
    get()._save(tree);
    set({ tree, selectedNodeId: null });
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterArea: (area) => set({ filterArea: area }),
  setFilterVacant: (v) => set({ filterVacant: v }),
}));
