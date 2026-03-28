import { create } from 'zustand';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { seedOrgData } from '../data/seedData';
import { updateNode, addChild, removeNode, moveNode } from '../utils/treeUtils';

const STORAGE_KEY = 'aba-organigrama';
const FIRESTORE_DOC = doc(db, 'organigrama', 'tree');

function loadFromCache() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveToCache(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveToFirestore(data) {
  saveToCache(data);
  setDoc(FIRESTORE_DOC, { data: JSON.stringify(data) }).catch(err =>
    console.error('Error guardando en Firestore:', err)
  );
}

export const useOrgStore = create((set, get) => ({
  tree: loadFromCache() || structuredClone(seedOrgData),
  selectedNodeId: null,
  expandedNodes: new Set(['dg', 'tec_com', 'ops', 'deposito', 'admin', 'sistemas']),
  searchQuery: '',
  filterArea: null,
  filterVacant: false,
  _initialized: false,

  initListener: () => {
    if (get()._initialized) return;
    set({ _initialized: true });
    onSnapshot(FIRESTORE_DOC, (snap) => {
      if (snap.exists()) {
        try {
          const tree = JSON.parse(snap.data().data);
          saveToCache(tree);
          set({ tree });
        } catch (err) {
          console.error('Error parseando datos de Firestore:', err);
        }
      } else {
        // First time: push seed data to Firestore
        const seed = structuredClone(seedOrgData);
        saveToFirestore(seed);
        set({ tree: seed });
      }
    }, (err) => {
      console.error('Error en listener de Firestore:', err);
    });
  },

  setTree: (tree) => {
    saveToFirestore(tree);
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
    saveToFirestore(newTree);
    set({ tree: newTree });
  },

  addChildNode: (parentId, newNode) => {
    const newTree = addChild(get().tree, parentId, newNode);
    saveToFirestore(newTree);
    set({ tree: newTree });
  },

  removeNodeById: (id, reparent = false) => {
    const newTree = removeNode(get().tree, id, reparent);
    saveToFirestore(newTree);
    set({ tree: newTree, selectedNodeId: null });
  },

  moveNodeTo: (nodeId, newParentId) => {
    const newTree = moveNode(get().tree, nodeId, newParentId);
    saveToFirestore(newTree);
    set({ tree: newTree });
  },

  resetToSeed: () => {
    const fresh = structuredClone(seedOrgData);
    saveToFirestore(fresh);
    set({ tree: fresh, selectedNodeId: null });
  },

  importTree: (tree) => {
    saveToFirestore(tree);
    set({ tree, selectedNodeId: null });
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterArea: (area) => set({ filterArea: area }),
  setFilterVacant: (v) => set({ filterVacant: v }),
}));
