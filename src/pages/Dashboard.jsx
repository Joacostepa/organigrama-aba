import { useOrgStore } from '../stores/orgStore';
import { usePeopleStore } from '../stores/peopleStore';
import { countNodes, countVacant, getUniqueAreas, getAllNodes } from '../utils/treeUtils';

export default function Dashboard() {
  const tree = useOrgStore(s => s.tree);
  const people = usePeopleStore(s => s.people);

  const totalNodes = countNodes(tree);
  const totalVacant = countVacant(tree);
  const totalOccupied = totalNodes - totalVacant;
  const areas = getUniqueAreas(tree);
  const allNodes = getAllNodes(tree);
  const unassignedPeople = people.filter(p => p.puestosAsignados.length === 0);
  const assignedPeople = people.filter(p => p.puestosAsignados.length > 0).sort((a, b) => b.puestosAsignados.length - a.puestosAsignados.length);

  const vacantNodes = allNodes.filter(n => !people.some(p => p.puestosAsignados.includes(n.id)));
  const occupancyRate = totalNodes > 0 ? Math.round((totalOccupied / totalNodes) * 100) : 0;

  const areaStats = areas.map(area => {
    const areaNodes = allNodes.filter(n => {
      if (n.id === area.id) return true;
      const findInChildren = (node, target) => {
        if (node.id === target) return true;
        return (node.children || []).some(c => findInChildren(c, target));
      };
      const areaNode = allNodes.find(a => a.id === area.id);
      return areaNode ? findInChildren(areaNode, n.id) : false;
    });
    const areaVacant = areaNodes.filter(n => !people.some(p => p.puestosAsignados.includes(n.id))).length;
    return { ...area, total: areaNodes.length, vacant: areaVacant };
  });

  const StatCard = ({ label, value, accent, sub }) => (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--c-bg-surface)', border: '1px solid var(--c-border)' }}>
      <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color: accent || 'var(--c-text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--c-text-faint)' }}>{sub}</p>}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--c-text-primary)' }}>Resumen</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Áreas" value={areas.length} accent="#00b4d8" />
          <StatCard label="Puestos" value={totalNodes} accent="#f77f00" />
          <StatCard label="Personas" value={people.length} accent="#06d6a0" />
          <StatCard label="Vacantes" value={totalVacant} accent="#e94560" sub={`${occupancyRate}% ocupado`} />
        </div>

        {/* Areas breakdown */}
        <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: 'var(--c-bg-surface)', border: '1px solid var(--c-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--c-text-primary)' }}>Por Área</h2>
          <div className="space-y-3">
            {areaStats.map(area => (
              <div key={area.id} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: area.accent }} />
                <span className="text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--c-text-secondary)' }}>{area.label}</span>
                <span className="text-sm" style={{ color: 'var(--c-text-muted)' }}>{area.total} puestos</span>
                {area.vacant > 0 && (
                  <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">{area.vacant} vacantes</span>
                )}
                <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--c-border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${area.total > 0 ? ((area.total - area.vacant) / area.total) * 100 : 0}%`,
                      backgroundColor: area.accent
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--c-bg-surface)', border: '1px solid var(--c-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--c-text-primary)' }}>Puestos Vacantes ({totalVacant})</h2>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {vacantNodes.length === 0 ? (
                <p className="text-sm italic" style={{ color: 'var(--c-text-faint)' }}>Todos los puestos tienen responsable</p>
              ) : (
                vacantNodes.map(node => (
                  <div
                    key={node.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ color: node.accent }}>{node.icon}</span>
                    <span className="text-sm truncate" style={{ color: 'var(--c-text-tertiary)' }}>{node.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--c-bg-surface)', border: '1px solid var(--c-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--c-text-primary)' }}>Personas sin Puesto ({unassignedPeople.length})</h2>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {unassignedPeople.length === 0 ? (
                <p className="text-sm italic" style={{ color: 'var(--c-text-faint)' }}>
                  {people.length === 0 ? 'No hay personas cargadas' : 'Todas las personas tienen puesto asignado'}
                </p>
              ) : (
                unassignedPeople.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: 'var(--c-avatar-from)', color: 'var(--c-text-primary)' }}>
                      {p.nombre[0]}{p.apellido?.[0] || ''}
                    </div>
                    <span className="text-sm truncate" style={{ color: 'var(--c-text-tertiary)' }}>{p.nombre} {p.apellido}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Carga por persona */}
        <div className="rounded-xl p-5 mt-6" style={{ backgroundColor: 'var(--c-bg-surface)', border: '1px solid var(--c-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--c-text-primary)' }}>Carga por Persona</h2>
          {assignedPeople.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--c-text-faint)' }}>
              {people.length === 0 ? 'No hay personas cargadas' : 'Ninguna persona tiene puesto asignado'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {assignedPeople.map(p => {
                const puestoNames = p.puestosAsignados.map(id => {
                  const node = allNodes.find(n => n.id === id);
                  return node ? { label: node.label, accent: node.accent } : { label: id, accent: 'var(--c-text-muted)' };
                });
                return (
                  <div key={p.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--c-bg-input)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--c-avatar-from)', color: 'var(--c-text-primary)' }}>
                      {p.nombre[0]}{p.apellido?.[0] || ''}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--c-text-primary)' }}>{p.nombre} {p.apellido}</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: p.puestosAsignados.length > 2 ? 'rgba(234,69,96,0.15)' : p.puestosAsignados.length > 1 ? 'rgba(247,127,0,0.15)' : 'rgba(6,214,160,0.15)',
                            color: p.puestosAsignados.length > 2 ? '#e94560' : p.puestosAsignados.length > 1 ? '#f77f00' : '#06d6a0',
                          }}
                        >
                          {p.puestosAsignados.length} {p.puestosAsignados.length === 1 ? 'puesto' : 'puestos'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {puestoNames.map((puesto, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{ backgroundColor: `${puesto.accent}15`, color: puesto.accent, border: `1px solid ${puesto.accent}30` }}
                          >
                            {puesto.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
