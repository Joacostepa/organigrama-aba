import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const STORAGE_KEY = 'aba-personas';
const FIRESTORE_DOC = doc(db, 'organigrama', 'people');

function loadFromCache() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToCache(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveToFirestore(data) {
  saveToCache(data);
  setDoc(FIRESTORE_DOC, { data: JSON.stringify(data) }).catch(err =>
    console.error('Error guardando personas en Firestore:', err)
  );
}

export const usePeopleStore = create((set, get) => ({
  people: loadFromCache(),
  _initialized: false,

  initListener: () => {
    if (get()._initialized) return;
    set({ _initialized: true });
    onSnapshot(FIRESTORE_DOC, (snap) => {
      if (snap.exists()) {
        try {
          const people = JSON.parse(snap.data().data);
          saveToCache(people);
          set({ people });
        } catch (err) {
          console.error('Error parseando personas de Firestore:', err);
        }
      } else {
        saveToFirestore([]);
      }
    }, (err) => {
      console.error('Error en listener de personas:', err);
    });
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
    saveToFirestore(updated);
    set({ people: updated });
    return newPerson;
  },

  updatePerson: (id, updates) => {
    const updated = get().people.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    saveToFirestore(updated);
    set({ people: updated });
  },

  removePerson: (id) => {
    const updated = get().people.filter(p => p.id !== id);
    saveToFirestore(updated);
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
    saveToFirestore(updated);
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
    saveToFirestore(updated);
    set({ people: updated });
  },

  getPersonById: (id) => get().people.find(p => p.id === id),

  getPeopleForNode: (nodeId) => get().people.filter(p => p.puestosAsignados.includes(nodeId)),

  getUnassignedPeople: () => get().people.filter(p => p.puestosAsignados.length === 0),

  importPeople: (people) => {
    saveToFirestore(people);
    set({ people });
  },

  resetPeople: () => {
    saveToFirestore([]);
    set({ people: [] });
  },
}));
