import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useDemoDataStore, useDemoRevision } from '../app/store/demoDataStore';
import { getCurrentActors } from '../data/services/universityData';
import { useAppStore } from '../app/store/appStore';
import { getActiveChild, getActiveSection, navSections } from '../routes/navigation';
import { ToastContainer } from '../components/ToastContainer';
import { toast } from '../lib/toast';

export function AdminLayout() {
  useDemoRevision();
  const { users, sessions, semesters } = getCurrentActors();
  const resetDemoData = useDemoDataStore((state) => state.resetDemoData);
  const location = useLocation();
  const {
    selectedSessionId,
    selectedSemesterId,
    selectedUserId,
    sidebarOpen,
    setSelectedSessionId,
    setSelectedSemesterId,
    setSelectedUserId,
    setSidebarOpen,
  } = useAppStore();

  // const currentUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const activeSection = useMemo(() => getActiveSection(location.pathname), [location.pathname]);
  const activeRoute = useMemo(() => getActiveChild(location.pathname), [location.pathname]);
  const [openSectionId, setOpenSectionId] = useState(activeSection.id);

  useEffect(() => {
    setOpenSectionId(activeSection.id);
  }, [activeSection.id]);

  return (
    <div className="app-shell">
      <aside className={sidebarOpen ? 'sidebar is-mobile-open' : 'sidebar'}>
        <div className="sidebar__inner">
          <div className="brand-block">
            <img src="/media/icon.png" alt="Unicare" className="brand-logo" />
            <div>
              <strong>Educare University</strong>
              <p>Admin Portal</p>
            </div>
          </div>

          <div className="sidebar-scroll">
            <nav className="sidebar-nav" aria-label="Primary">
              {navSections.map((section) => {
                const isOpen = openSectionId === section.id;
                const isActive = activeSection.id === section.id;

                return (
                  <div key={section.id} className={isActive ? 'nav-section is-active' : 'nav-section'}>
                    <button
                      type="button"
                      className={isOpen ? 'nav-section__trigger is-open' : 'nav-section__trigger'}
                      onClick={() => setOpenSectionId(isOpen ? '' : section.id)}
                    >
                      <span className="nav-section__icon">{section.icon}</span>
                      <span className="nav-section__label">{section.label}</span>
                      <span className="nav-section__arrow">{isOpen ? '-' : '+'}</span>
                    </button>

                    {isOpen ? (
                      <div className="nav-section__children">
                        {section.items.map((item) => (
                          <NavLink
                            key={item.id}
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive: isExactActive }) =>
                              isExactActive || location.pathname.startsWith(item.matchPrefix ?? item.to)
                                ? 'sidebar-sublink is-active'
                                : 'sidebar-sublink'
                            }
                          >
                            {item.label}
                          </NavLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* <div className="sidebar-footnote">
            <strong>Phase 1</strong>
            <p>Registry, student records, fees, course registration, results, reporting.</p>
          </div> */}
        </div>
      </aside>

      {sidebarOpen ? <button type="button" className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close menu" /> : null}

      <main className="main-shell">
        <header className="topbar">
          <button type="button" className="menu-button" onClick={() => setSidebarOpen(!sidebarOpen)}>
            Menu
          </button>
          <div className="topbar__route">
            <p className="topbar__eyebrow">Current workspace</p>
            <h2>{activeSection.label}</h2>
            <span className="topbar__route-meta">{activeRoute.child.label}</span>
          </div>
          <div className="topbar__controls">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                if (window.confirm('Reset the interactive demo data to the original seed state?')) {
                  resetDemoData();
                  toast.info('Demo data reset to seed state');
                }
              }}
            >
              Reset demo
            </button>
            <label>
              Acting as
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Session
              <select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Semester
              <select value={selectedSemesterId} onChange={(event) => setSelectedSemesterId(event.target.value)}>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        {/* <section className="context-banner">
          <div>
            <span className="eyebrow">Active operator</span>
            <strong>{currentUser.name}</strong>
          </div>
          <div className="context-banner__meta">
            <span>{currentUser.email}</span>
            <span>{activeRoute.child.label}</span>
          </div>
        </section> */}

        <div className="page-shell">
          <Outlet />
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
