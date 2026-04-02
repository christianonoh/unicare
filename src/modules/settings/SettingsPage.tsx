import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { getSettingsBlueprint } from '../../data/services/universityData';

type SettingsView = 'institution' | 'policy';

interface SettingsPageProps {
  view?: SettingsView;
}

export function SettingsPage({ view = 'institution' }: SettingsPageProps) {
  useDemoRevision();
  const resetDemoData = useDemoDataStore((state) => state.resetDemoData);
  const settings = getSettingsBlueprint();
  const content: Record<SettingsView, { title: string; description: string }> = {
    institution: {
      title: 'Institution profile',
      description: 'Core organization-wide settings that will later become persistent university configuration.',
    },
    policy: {
      title: 'Academic policy',
      description: 'The governance and academic rules the real product will eventually persist and enforce.',
    },
  };

  return (
    <div className="page-grid">
      <PageHeader eyebrow="System setup" title={content[view].title} description={content[view].description} />

      {view === 'institution' ? (
        <div className="split-grid">
          <SectionCard title="Institution profile" subtitle="Core setup values likely to become persistent configuration later.">
            <div className="info-grid">
              <div><span>Institution</span><strong>{settings.institutionName}</strong></div>
              <div><span>Grading model</span><strong>{settings.gradingScale}</strong></div>
              <div><span>Registration policy</span><strong>{settings.registrationPolicy}</strong></div>
              <div><span>Phase</span><strong>Frontend-only demo</strong></div>
            </div>
          </SectionCard>

          <SectionCard title="Enabled modules" subtitle="Useful for positioning scope and guiding later backend service boundaries.">
            <div className="tag-cloud">
              {settings.enabledModules.map((module) => (
                <span key={module} className="tag">
                  {module}
                </span>
              ))}
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  if (window.confirm('Reset the demo data back to the original seed state?')) {
                    resetDemoData();
                  }
                }}
              >
                Reset demo data
              </button>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {view === 'policy' ? (
        <SectionCard title="Result workflow blueprint" subtitle="Explicitly calls out the future approval chain so the prototype informs authorization and database design.">
          <div className="timeline">
            {settings.resultWorkflow.map((step) => (
              <div key={step} className="timeline-item">
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
