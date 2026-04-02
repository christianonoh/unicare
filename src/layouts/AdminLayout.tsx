import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useDemoDataStore, useDemoRevision } from '../app/store/demoDataStore';
import { useAppStore } from '../app/store/appStore';
import { usePageMetaStore } from '../app/store/pageMetaStore';
import { getActiveChild, getActiveSection, navSections } from '../routes/navigation';
import { ToastContainer } from '../components/ToastContainer';
import { toast } from '../lib/toast';

export function AdminLayout() {
  useDemoRevision();
  const resetDemoData = useDemoDataStore((state) => state.resetDemoData);
  const location = useLocation();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const pageMeta = usePageMetaStore((state) => state.meta);
  const activeSection = useMemo(() => getActiveSection(location.pathname), [location.pathname]);
  const activeRoute = useMemo(() => getActiveChild(location.pathname), [location.pathname]);
  const [openSectionOverrideId, setOpenSectionOverrideId] = useState('');
  const openSectionId = openSectionOverrideId || activeSection.id;

  const currentMeta = pageMeta?.pathname === location.pathname ? pageMeta : null;
  const pageTitle = currentMeta?.title ?? activeRoute.child.label;
  const pageDescription = currentMeta?.description ?? '';
  const pageActions = currentMeta?.actions;
  const normalizedPath = location.pathname.replace(/\/$/, '') || '/';
  const normalizedChildPath = activeRoute.child.to.replace(/\/$/, '') || '/';
  const isDetailRoute = normalizedPath !== normalizedChildPath;
  const breadcrumbs = isDetailRoute
    ? [
        { label: activeSection.label, to: activeSection.basePath },
        { label: activeRoute.child.label, to: activeRoute.child.to },
        { label: currentMeta?.breadcrumbLabel ?? pageTitle },
      ]
    : [
        { label: activeSection.label, to: activeSection.basePath },
        { label: activeRoute.child.label },
      ];

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
                      onClick={() => setOpenSectionOverrideId(isOpen ? '' : section.id)}
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
          <div className="topbar__main">
            <nav className="topbar__breadcrumbs" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <span key={`${crumb.label}-${index}`} className="topbar__breadcrumb-item">
                    {crumb.to && !isLast ? (
                      <Link to={crumb.to} className="topbar__breadcrumb-link">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? 'topbar__breadcrumb-current' : 'topbar__breadcrumb-link'}>{crumb.label}</span>
                    )}
                    {!isLast ? <span className="topbar__breadcrumb-separator">/</span> : null}
                  </span>
                );
              })}
            </nav>

            <div className="topbar__copy">
              <h1>{pageTitle}</h1>
              {pageDescription ? <p>{pageDescription}</p> : null}
              {pageActions ? <div className="topbar__page-actions">{pageActions}</div> : null}
            </div>
          </div>
          <div className="topbar__controls">
            <button
              type="button"
              className="ghost-button ghost-button--sm"
              onClick={() => {
                if (window.confirm('Reset the interactive demo data to the original seed state?')) {
                  resetDemoData();
                  toast.info('Demo data reset to seed state');
                }
              }}
            >
              Reset demo
            </button>
          </div>
        </header>

        <div className="page-shell">
          <Outlet />
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
