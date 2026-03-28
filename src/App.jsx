import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import OrgChart from './pages/OrgChart';
import Team from './pages/Team';
import Dashboard from './pages/Dashboard';
import OrgSelector from './pages/OrgSelector';
import { useOrgStore } from './stores/orgStore';
import { usePeopleStore } from './stores/peopleStore';
import { useOrgListStore } from './stores/orgListStore';

export default function App() {
  const [currentPage, setCurrentPage] = useState('orgchart');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState(null);

  const loadOrg = useOrgStore(s => s.loadOrg);
  const unloadOrg = useOrgStore(s => s.unloadOrg);
  const loadPeopleOrg = usePeopleStore(s => s.loadOrg);
  const unloadPeopleOrg = usePeopleStore(s => s.unloadOrg);
  const initOrgList = useOrgListStore(s => s.initListener);
  const orgList = useOrgListStore(s => s.orgList);

  useEffect(() => {
    initOrgList();
  }, [initOrgList]);

  const handleSelectOrg = (orgId) => {
    setActiveOrgId(orgId);
    loadOrg(orgId);
    loadPeopleOrg(orgId);
    setCurrentPage('orgchart');
  };

  const handleBackToList = () => {
    unloadOrg();
    unloadPeopleOrg();
    setActiveOrgId(null);
  };

  if (!activeOrgId) {
    return <OrgSelector onSelect={handleSelectOrg} />;
  }

  const activeOrg = orgList.find(o => o.id === activeOrgId);

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--c-bg-main)' }}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        orgName={activeOrg?.name || 'Organigrama'}
        onBack={handleBackToList}
      />
      <main className="flex-1 overflow-hidden">
        {currentPage === 'orgchart' && <OrgChart />}
        {currentPage === 'team' && <Team />}
        {currentPage === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}
