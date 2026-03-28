import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function cacheKey(orgId) { return `aba-people-${orgId}`; }

function loadFromCache(orgId) {
  try {
    const data = localStorage.getItem(cacheKey(orgId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToCache(orgId, data) {
  localStorage.setItem(cacheKey(orgId), JSON.stringify(data));
}

export const usePeopleStore = create((set, get) => ({
  people: [],
  _currentOrgId: null,
  _unsubscribe: null,

  loadOrg: (orgId) => {
    const { _unsubscribe, _currentOrgId } = get();
    if (_currentOrgId === orgId) return;

    if (_unsubscribe) _unsubscribe();

    const cached = loadFromCache(orgId);
    set({ people: cached, _currentOrgId: orgId });

    const docRef = doc(db, 'organigramas', orgId, 'data', 'people');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        try {
          const people = JSON.parse(snap.data().data);
          saveToCache(orgId, people);
          if (get()._currentOrgId === orgId) {
            set({ people });
          }
        } catch (err) {
          console.error('Error parseando personas:', err);
        }
      } else {
        setDoc(docRef, { data: JSON.stringify([]) });
      }
    });

    set({ _unsubscribe: unsub });
  },

  unloadOrg: () => {
    const { _unsubscribe } = get();
    if (_unsubscribe) _unsubscribe();
    set({ _currentOrgId: null, _unsubscribe: null, people: [] });
  },

  _save: (people) => {
    const orgId = get()._currentOrgId;
    if (!orgId) return;
    saveToCache(orgId, people);
    const docRef = doc(db, 'organigramas', orgId, 'data', 'people');
    setDoc(docRef, { data: JSON.stringify(people) }).catch(err =>
      console.error('Error guardando personas:', err)
    );
  },

  addPerson: (person) => {
    const now = new Date().toISOString();
    const newPerson = {
      id: uuidv4(),
      nombre: person.nombre || '',
      apellido: person.apellido || '',
      email: person.email || null,
      telefono: person.telefono || null,
      fotoUrl: person.fotoUrl || null,
      fechaIngreso: person.fechaIngreso || null,
      notas: person.notas || null,
      puestosAsignados: person.puestosAsignados || [],
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...get().people, newPerson];
    get()._save(updated);
    set({ people: updated });
    return newPerson;
  },

  updatePerson: (id, updates) => {
    const updated = get().people.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    get()._save(updated);
    set({ people: updated });
  },

  removePerson: (id) => {
    const updated = get().people.filter(p => p.id !== id);
    get()._save(updated);
    set({ people: updated });
  },

  assignToNode: (personId, nodeId) => {
    const updated = get().people.map(p => {
      if (p.id === personId) {
        const puestos = p.puestosAsignados.includes(nodeId)
          ? p.puestosAsignados
          : [...p.puestosAsignados, nodeId];
        return { ...p, puestosAsignados: puestos, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    get()._save(updated);
    set({ people: updated });
  },

  unassignFromNode: (personId, nodeId) => {
    const updated = get().people.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          puestosAsignados: p.puestosAsignados.filter(id => id !== nodeId),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    get()._save(updated);
    set({ people: updated });
  },

  getPersonById: (id) => get().people.find(p => p.id === id),
  getPeopleForNode: (nodeId) => get().people.filter(p => p.puestosAsignados.includes(nodeId)),
  getUnassignedPeople: () => get().people.filter(p => p.puestosAsignados.length === 0),

  importPeople: (people) => {
    get()._save(people);
    set({ people });
  },

  resetPeople: () => {
    get()._save([]);
    set({ people: [] });
  },
}));
