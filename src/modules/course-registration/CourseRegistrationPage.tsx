import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getRegistrationByStudentAndSemester, listRegistrations } from '../../data/services/universityData';
import { statusTone } from '../../lib/status';

type RegistrationView = 'queue' | 'approved' | 'held';

interface CourseRegistrationPageProps {
  view?: RegistrationView;
}

export function CourseRegistrationPage({ view = 'queue' }: CourseRegistrationPageProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const allRegistrations = listRegistrations();
  const registrations = allRegistrations.filter((registration) => {
    if (view === 'approved') {
      return registration.status === 'approved';
    }
    if (view === 'held') {
      return registration.status === 'held';
    }
    return registration.status === 'pending' || registration.status === 'held' || registration.status === 'rejected' || registration.status === 'approved';
  });
  const selectedRegistration = selectedStudentId ? getRegistrationByStudentAndSemester(selectedStudentId) : null;
  const pageContent: Record<RegistrationView, { title: string; description: string; sectionTitle: string }> = {
    queue: {
      title: 'Registration queue',
      description: 'A registrar and HOD view of registration packs moving through financial checks, adviser review, and departmental approval.',
      sectionTitle: 'Registration work queue',
    },
    approved: {
      title: 'Approved registrations',
      description: 'A clean view of students whose course forms have cleared the approval ladder for the active semester.',
      sectionTitle: 'Approved packs',
    },
    held: {
      title: 'Held registration cases',
      description: 'The operational risk queue where fees, approval blockers, and unresolved issues prevent normal progression.',
      sectionTitle: 'Held packs',
    },
  };

  const columns = [
    createColumnHelper<(typeof registrations)[number]>().accessor('studentName', {
      header: 'Student',
      cell: (info) => (
        <button type="button" className="link-button" onClick={() => setSelectedStudentId(info.row.original.studentId)}>
          {info.getValue()}
        </button>
      ),
    }),
    createColumnHelper<(typeof registrations)[number]>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof registrations)[number]>().accessor('totalUnits', { header: 'Units', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof registrations)[number]>().accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
    createColumnHelper<(typeof registrations)[number]>().accessor('hodReview', {
      header: 'HOD review',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Course registration"
        title={pageContent[view].title}
        description={pageContent[view].description}
      />

      <div className="split-grid split-grid--wide">
        <SectionCard title={pageContent[view].sectionTitle} subtitle="Select a row to inspect the exact course mix and approval posture for a student.">
          <DataTable data={registrations} columns={columns} />
        </SectionCard>

        <SectionCard title="Selected registration" subtitle="A believable right-side panel for demos and stakeholder walkthroughs.">
          {selectedRegistration ? (
            <>
              <div className="info-grid">
                <div><span>Status</span><StatusBadge tone={statusTone(selectedRegistration.registration.status)} label={selectedRegistration.registration.status} /></div>
                <div><span>Adviser</span><StatusBadge tone={statusTone(selectedRegistration.registration.adviserReview)} label={selectedRegistration.registration.adviserReview} /></div>
                <div><span>HOD</span><StatusBadge tone={statusTone(selectedRegistration.registration.hodReview)} label={selectedRegistration.registration.hodReview} /></div>
                <div><span>Financial hold</span><StatusBadge tone={selectedRegistration.registration.hasFinancialHold ? 'held' : 'approved'} label={selectedRegistration.registration.hasFinancialHold ? 'held' : 'clear'} /></div>
              </div>
              <div className="list-stack">
                {selectedRegistration.items.map((item) => (
                  <div key={item.id} className="list-row">
                    <div>
                      <strong>{item.course?.code}</strong>
                      <p>{item.course?.title}</p>
                    </div>
                    <div className="row-meta">
                      <span>{item.course?.units} units</span>
                      <StatusBadge tone={statusTone(item.status)} label={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">Select a student registration row to inspect its workflow state.</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
