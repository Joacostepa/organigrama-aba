import { create } from 'zustand';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION = 'organigramas';

export const useOrgListStore = create((set, get) => ({
  orgList: [],
  activeOrgId: null,
  loading: true,
  _initialized: false,

  initListener: () => {
    if (get()._initialized) return;
    set({ _initialized: true });
    onSnapshot(collection(db, COLLECTION), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      set({ orgList: list, loading: false });
    }, (err) => {
      console.error('Error cargando lista de organigramas:', err);
      set({ loading: false });
    });
  },

  createOrg: async (name, description = '') => {
    const id = uuidv4();
    const now = new Date().toISOString();
    await setDoc(doc(db, COLLECTION, id), {
      name,
      description,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },

  updateOrg: async (id, updates) => {
    await setDoc(doc(db, COLLECTION, id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  deleteOrg: async (id) => {
    // Delete subcollection docs first
    await deleteDoc(doc(db, COLLECTION, id, 'data', 'tree')).catch(() => {});
    await deleteDoc(doc(db, COLLECTION, id, 'data', 'people')).catch(() => {});
    await deleteDoc(doc(db, COLLECTION, id));
    if (get().activeOrgId === id) {
      set({ activeOrgId: null });
    }
  },

  setActiveOrg: (id) => set({ activeOrgId: id }),
  clearActiveOrg: () => set({ activeOrgId: null }),
}));
