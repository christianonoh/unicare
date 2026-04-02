import { useDemoRevision } from '../../app/store/demoDataStore';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getReferenceData, listUsers } from '../../data/services/universityData';

type AccessView = 'users' | 'roles';

interface UsersPageProps {
  view?: AccessView;
}

export function UsersPage({ view = 'users' }: UsersPageProps) {
  useDemoRevision();
  const users = listUsers();
  const { roles } = getReferenceData();
  const content: Record<AccessView, { title: string; description: string }> = {
    users: {
      title: 'Users',
      description: 'Named admin actors and academic officers who will interact with the university platform.',
    },
    roles: {
      title: 'Roles',
      description: 'Access roles expressed in university language so permissions can later align with registry, bursary, faculty, and department workflows.',
    },
  };

  return (
    <div className="page-grid">
      <PageHeader eyebrow="Access model" title={content[view].title} description={content[view].description} />

      {view === 'users' ? (
        <SectionCard title="Admin actors" subtitle="Seeded users help stakeholders see who is meant to work where in the system.">
          <div className="list-stack">
            {users.map((user) => (
              <div key={user.id} className="list-row">
                <div>
                  <strong>{user.name}</strong>
                  <p>{user.roleName}</p>
                </div>
                <div className="row-meta">
                  <span>{user.departmentName}</span>
                  <StatusBadge tone="info" label={user.facultyName} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {view === 'roles' ? (
        <SectionCard title="Role capability map" subtitle="A compact way to align access control and future backend authorization.">
          <div className="list-stack">
            {roles.map((role) => (
              <div key={role.id} className="list-row list-row--column">
                <div className="row-meta">
                  <strong>{role.name}</strong>
                  <span>{role.scope}</span>
                </div>
                <div className="tag-cloud">
                  {role.permissions.map((permission) => (
                    <span key={permission} className="tag">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
