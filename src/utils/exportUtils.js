export function exportToJSON(orgData, people) {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    organigrama: orgData,
    personas: people
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `organigrama-aba-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.organigrama) {
          reject(new Error('Formato inválido: falta el organigrama'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Error al parsear el archivo JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}
