import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getRegistrationByStudentAndSemester, listRegistrations, getReferenceData } from '../../data/services/universityData';
import { statusTone } from '../../lib/status';
import { toast } from '../../lib/toast';
import type { RegistrationStatus } from '../../types/domain';

type RegistrationView = 'queue' | 'approved' | 'held';

interface CourseRegistrationPageProps {
  view?: RegistrationView;
}

export function CourseRegistrationPage({ view = 'queue' }: CourseRegistrationPageProps) {
  useDemoRevision();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [addCourseId, setAddCourseId] = useState('');
  const updateRegistrationReview = useDemoDataStore((state) => state.updateRegistrationReview);
  const addCourseToRegistration = useDemoDataStore((state) => state.addCourseToRegistration);
  const dropCourseFromRegistration = useDemoDataStore((state) => state.dropCourseFromRegistration);
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

  const { courses } = getReferenceData();
  const registeredCourseIds = new Set(selectedRegistration?.items.map((item) => item.courseId) ?? []);
  const availableCourses = courses.filter((course) => !registeredCourseIds.has(course.id));

  function handleReview(field: 'adviserReview' | 'hodReview', status: RegistrationStatus) {
    if (!selectedRegistration) return;
    const result = updateRegistrationReview(selectedRegistration.registration.id, field, status);
    result.ok ? toast.success(result.message) : toast.error(result.message);
  }

  function handleAddCourse() {
    if (!selectedRegistration || !addCourseId) return;
    const result = addCourseToRegistration(selectedRegistration.registration.id, addCourseId);
    result.ok ? toast.success(result.message) : toast.error(result.message);
    if (result.ok) setAddCourseId('');
  }

  function handleDropCourse(courseId: string) {
    if (!selectedRegistration) return;
    const result = dropCourseFromRegistration(selectedRegistration.registration.id, courseId);
    result.ok ? toast.success(result.message) : toast.error(result.message);
  }

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

        <SectionCard title="Selected registration" subtitle="Inspect, approve, or modify a student's course registration.">
          {selectedRegistration ? (
            <>
              <div className="info-grid">
                <div><span>Status</span><StatusBadge tone={statusTone(selectedRegistration.registration.status)} label={selectedRegistration.registration.status} /></div>
                <div><span>Adviser</span><StatusBadge tone={statusTone(selectedRegistration.registration.adviserReview)} label={selectedRegistration.registration.adviserReview} /></div>
                <div><span>HOD</span><StatusBadge tone={statusTone(selectedRegistration.registration.hodReview)} label={selectedRegistration.registration.hodReview} /></div>
                <div><span>Financial hold</span><StatusBadge tone={selectedRegistration.registration.hasFinancialHold ? 'held' : 'approved'} label={selectedRegistration.registration.hasFinancialHold ? 'held' : 'clear'} /></div>
              </div>

              <div className="button-row" style={{ padding: '8px 0' }}>
                <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleReview('adviserReview', 'approved')}>Adviser approve</button>
                <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleReview('hodReview', 'approved')}>HOD approve</button>
                <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleReview('hodReview', 'rejected')}>HOD reject</button>
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
                      <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleDropCourse(item.courseId)}>Drop</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-grid" style={{ marginTop: 8 }}>
                <label className="field-group">
                  <span>Add course</span>
                  <select value={addCourseId} onChange={(e) => setAddCourseId(e.target.value)}>
                    <option value="">Select a course...</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>{course.code} - {course.title} ({course.units}u)</option>
                    ))}
                  </select>
                </label>
                <div className="field-group field-group--actions">
                  <span>Action</span>
                  <button type="button" className="primary-button" onClick={handleAddCourse} disabled={!addCourseId}>Add course</button>
                </div>
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
