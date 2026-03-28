import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import OrgChart from './pages/OrgChart';
import Team from './pages/Team';
import Dashboard from './pages/Dashboard';
import { useOrgStore } from './stores/orgStore';
import { usePeopleStore } from './stores/peopleStore';

export default function App() {
  const [currentPage, setCurrentPage] = useState('orgchart');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const initOrg = useOrgStore(s => s.initListener);
  const initPeople = usePeopleStore(s => s.initListener);

  useEffect(() => {
    initOrg();
    initPeople();
  }, [initOrg, initPeople]);

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--c-bg-main)' }}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 overflow-hidden">
        {currentPage === 'orgchart' && <OrgChart />}
        {currentPage === 'team' && <Team />}
        {currentPage === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}
