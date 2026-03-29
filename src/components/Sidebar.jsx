import { useOrgStore } from '../stores/orgStore';
import { usePeopleStore } from '../stores/peopleStore';
import { useThemeStore } from '../stores/themeStore';
import { getUniqueAreas, countNodes, countVacant } from '../utils/treeUtils';
import { NODE_TYPES } from '../data/seedData';

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle, orgName, onBack }) {
  const { tree, searchQuery, setSearchQuery, filterArea, setFilterArea, filterType, setFilterType, filterVacant, setFilterVacant } = useOrgStore();
  const people = usePeopleStore(s => s.people);
  const { theme, toggleTheme } = useThemeStore();

  const areas = getUniqueAreas(tree);
  const totalNodes = countNodes(tree);
  const totalVacant = countVacant(tree);
  const totalPeople = people.length;

  const navBtn = (page, icon, label) => (
    <button
      onClick={() => onNavigate(page)}
      className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-colors"
      style={{
        backgroundColor: currentPage === page ? 'var(--c-bg-active)' : 'transparent',
        color: currentPage === page ? 'var(--c-text-primary)' : 'var(--c-text-tertiary)',
      }}
      onMouseEnter={e => { if (currentPage !== page) { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}}
      onMouseLeave={e => { if (currentPage !== page) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-tertiary)'; }}}
    >
      <span className="text-base">{icon}</span> {label}
    </button>
  );

  const navIcon = (page, icon, label) => (
    <button
      onClick={() => { onNavigate(page); onToggle(); }}
      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors"
      style={{
        backgroundColor: currentPage === page ? 'var(--c-bg-active)' : 'transparent',
        color: currentPage === page ? 'var(--c-text-primary)' : 'var(--c-text-muted)',
      }}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div
      className={`h-full flex flex-col transition-all duration-200 ${collapsed ? 'w-14' : 'w-64'}`}
      style={{ backgroundColor: 'var(--c-bg-surface)', borderRight: '1px solid var(--c-border)' }}
    >
      {/* Header */}
      <div className="px-3 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--c-border)' }}>
        {!collapsed && (
          <>
            <button
              onClick={onBack}
              className="w-7 h-7 flex items-center justify-center rounded text-xs flex-shrink-0 transition-colors"
              style={{ color: 'var(--c-text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
              title="Volver a mis organigramas"
            >
              ←
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold tracking-tight truncate" style={{ color: 'var(--c-text-primary)' }}>{orgName || 'Organigrama'}</h1>
              <p className="text-xs truncate" style={{ color: 'var(--c-text-muted)' }}>Andamios Buenos Aires</p>
            </div>
          </>
        )}
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded text-sm flex-shrink-0 transition-colors"
          style={{ color: 'var(--c-text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {collapsed ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors"
            style={{ color: 'var(--c-text-muted)' }}
            title="Volver a mis organigramas"
          >
            ←
          </button>
          <div className="w-6 my-1" style={{ borderTop: '1px solid var(--c-border)' }} />
          {navIcon('orgchart', '◆', 'Organigrama')}
          {navIcon('team', '👤', 'Equipo')}
          {navIcon('dashboard', '📊', 'Resumen')}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors mt-2"
            style={{ color: 'var(--c-text-muted)' }}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      ) : (
        <>
          {/* Navigation */}
          <nav className="px-2 py-3 space-y-1">
            {navBtn('orgchart', '◆', 'Organigrama')}
            {navBtn('team', '👤', 'Equipo')}
            {navBtn('dashboard', '📊', 'Resumen')}
          </nav>

          {/* Search */}
          {currentPage === 'orgchart' && (
            <div className="px-3 py-2">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar puesto, persona..."
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--c-bg-input)',
                  color: 'var(--c-text-secondary)',
                  border: '1px solid var(--c-border)',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--c-border-light)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
              />
            </div>
          )}

          {/* Filters */}
          {currentPage === 'orgchart' && (
            <div className="px-3 py-2 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Áreas</label>
                <div className="mt-1.5 space-y-1">
                  <button
                    onClick={() => setFilterArea(null)}
                    className="w-full text-left px-2 py-1 rounded text-xs transition-colors"
                    style={{
                      color: !filterArea ? 'var(--c-text-primary)' : 'var(--c-text-tertiary)',
                      backgroundColor: !filterArea ? 'var(--c-bg-active)' : 'transparent',
                    }}
                  >
                    Todas
                  </button>
                  {areas.map(area => (
                    <button
                      key={area.id}
                      onClick={() => setFilterArea(filterArea === area.id ? null : area.id)}
                      className="w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 transition-colors"
                      style={{
                        backgroundColor: filterArea === area.id ? 'var(--c-bg-active)' : 'transparent',
                      }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: area.accent }} />
                      <span style={{ color: filterArea === area.id ? area.accent : 'var(--c-text-tertiary)' }}>{area.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter by type */}
              <div>
                <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>Tipo</label>
                <div className="mt-1.5 flex gap-1 flex-wrap">
                  <button
                    onClick={() => setFilterType(null)}
                    className="px-2 py-1 rounded text-xs transition-colors"
                    style={{
                      color: !filterType ? 'var(--c-text-primary)' : 'var(--c-text-tertiary)',
                      backgroundColor: !filterType ? 'var(--c-bg-active)' : 'transparent',
                    }}
                  >
                    Todos
                  </button>
                  {Object.entries(NODE_TYPES).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => setFilterType(filterType === key ? null : key)}
                      className="px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors"
                      style={{
                        color: filterType === key ? 'var(--c-text-primary)' : 'var(--c-text-tertiary)',
                        backgroundColor: filterType === key ? 'var(--c-bg-active)' : 'transparent',
                      }}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setFilterVacant(!filterVacant)}
                className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors"
                style={{
                  border: filterVacant ? '1px solid rgba(234,179,8,0.5)' : '1px solid var(--c-border)',
                  color: filterVacant ? '#eab308' : 'var(--c-text-tertiary)',
                  backgroundColor: filterVacant ? 'rgba(234,179,8,0.1)' : 'transparent',
                }}
              >
                <span>⚠</span> Solo vacantes ({totalVacant})
              </button>
            </div>
          )}

          {/* Theme toggle + Stats */}
          <div className="mt-auto">
            <div className="px-3 py-2">
              <button
                onClick={toggleTheme}
                className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-colors"
                style={{ color: 'var(--c-text-tertiary)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-bg-hover)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-tertiary)'; }}
              >
                <span className="text-base">{theme === 'dark' ? '☀' : '☾'}</span>
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </button>
            </div>
            <div className="px-3 py-3" style={{ borderTop: '1px solid var(--c-border)' }}>
              <div className="flex justify-between text-xs" style={{ color: 'var(--c-text-faint)' }}>
                <span>{totalNodes} puestos</span>
                <span>{totalPeople} personas</span>
                <span>{totalVacant} vacantes</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
