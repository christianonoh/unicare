import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { AcademicScopePanel } from '../../components/AcademicScopePanel';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getAcademicScopeOptions, getReferenceData, getRegistrationByStudentAndSemester, listRegistrations, matchesAcademicScope } from '../../data/services/universityData';
import { statusTone } from '../../lib/status';
import { toast } from '../../lib/toast';
import type { RegistrationStatus } from '../../types/domain';

type RegistrationView = 'queue' | 'approved' | 'held';

interface CourseRegistrationPageProps {
  view?: RegistrationView;
}

const queueStatuses = new Set(['pending', 'held', 'rejected', 'approved']);

export function CourseRegistrationPage({ view = 'queue' }: CourseRegistrationPageProps) {
  useDemoRevision();
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(view === 'approved' ? 'approved' : view === 'held' ? 'held' : 'all-queue');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [addCourseId, setAddCourseId] = useState('');
  const updateRegistrationReview = useDemoDataStore((state) => state.updateRegistrationReview);
  const addCourseToRegistration = useDemoDataStore((state) => state.addCourseToRegistration);
  const dropCourseFromRegistration = useDemoDataStore((state) => state.dropCourseFromRegistration);
  const { faculties, departments, programmes, levels } = getAcademicScopeOptions({ facultyId, departmentId });
  const hasRequiredScope = Boolean(facultyId && departmentId);
  const allRegistrations = listRegistrations();
  const scopedRegistrations = allRegistrations.filter((registration) => matchesAcademicScope(registration, { facultyId, departmentId, programmeId, levelId }));
  const registrations = scopedRegistrations.filter((registration) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      registration.studentName.toLowerCase().includes(normalizedQuery) ||
      registration.matricNumber.toLowerCase().includes(normalizedQuery) ||
      registration.programmeName.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      view === 'approved'
        ? registration.status === 'approved'
        : view === 'held'
          ? registration.status === 'held'
          : statusFilter === 'all-queue'
            ? queueStatuses.has(registration.status)
            : registration.status === statusFilter;

    return matchesQuery && matchesStatus;
  });
  const selectedRegistration = selectedStudentId && registrations.some((registration) => registration.studentId === selectedStudentId) ? getRegistrationByStudentAndSemester(selectedStudentId) : null;
  const pageContent: Record<RegistrationView, { title: string; description: string; sectionTitle: string; sectionEmptyMessage: string }> = {
    queue: {
      title: 'Registration queue',
      description: 'A registrar and HOD workbench that now opens only after choosing the academic ownership layer first.',
      sectionTitle: 'Registration work queue',
      sectionEmptyMessage: 'Choose a faculty and department to load registrations.',
    },
    approved: {
      title: 'Approved registrations',
      description: 'A scoped view of students whose course forms have already cleared the approval ladder for the active semester.',
      sectionTitle: 'Approved packs',
      sectionEmptyMessage: 'Choose a faculty and department to load approved registrations.',
    },
    held: {
      title: 'Held registration cases',
      description: 'A scoped operational queue for fee blockers, approval blockers, and unresolved registration issues.',
      sectionTitle: 'Held packs',
      sectionEmptyMessage: 'Choose a faculty and department to load held registrations.',
    },
  };

  const { courses } = getReferenceData();
  const registeredCourseIds = new Set(selectedRegistration?.items.map((item) => item.courseId) ?? []);
  const availableCourses = courses.filter((course) => !registeredCourseIds.has(course.id));

  function handleReview(field: 'adviserReview' | 'hodReview', status: RegistrationStatus) {
    if (!selectedRegistration) {
      return;
    }

    const result = updateRegistrationReview(selectedRegistration.registration.id, field, status);
    if (result.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  }

  function handleAddCourse() {
    if (!selectedRegistration || !addCourseId) {
      return;
    }

    const result = addCourseToRegistration(selectedRegistration.registration.id, addCourseId);
    if (result.ok) {
      toast.success(result.message);
      setAddCourseId('');
      return;
    }

    toast.error(result.message);
  }

  function handleDropCourse(courseId: string) {
    if (!selectedRegistration) {
      return;
    }

    const result = dropCourseFromRegistration(selectedRegistration.registration.id, courseId);
    if (result.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  }

  function handleFacultyChange(value: string) {
    setFacultyId(value);
    setDepartmentId('');
    setProgrammeId('');
    setLevelId('');
    setSelectedStudentId(null);
  }

  function handleDepartmentChange(value: string) {
    setDepartmentId(value);
    setProgrammeId('');
    setLevelId('');
    setSelectedStudentId(null);
  }

  function handleProgrammeChange(value: string) {
    setProgrammeId(value);
    setLevelId('');
    setSelectedStudentId(null);
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
    createColumnHelper<(typeof registrations)[number]>().accessor('levelName', { header: 'Level', cell: (info) => info.getValue() }),
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
      <PageHeader eyebrow="Course registration" title={pageContent[view].title} description={pageContent[view].description} />

      <AcademicScopePanel
        title="Academic scope"
        description="Choose ownership first so registration work queues load in the right faculty and department context."
        facultyId={facultyId}
        departmentId={departmentId}
        programmeId={programmeId}
        levelId={levelId}
        faculties={faculties.map((faculty) => ({ id: faculty.id, label: faculty.name }))}
        departments={departments.map((department) => ({ id: department.id, label: department.name }))}
        programmes={programmes.map((programme) => ({ id: programme.id, label: `${programme.award} ${programme.name}` }))}
        levels={levels.map((level) => ({ id: level.id, label: level.name }))}
        resultLabel="registration packs in scope"
        resultCount={hasRequiredScope ? scopedRegistrations.length : 0}
        resultMeta="Page-level scope narrows the queue before search and status refine the rows below."
        emptyMessage={pageContent[view].sectionEmptyMessage}
        onFacultyChange={handleFacultyChange}
        onDepartmentChange={handleDepartmentChange}
        onProgrammeChange={handleProgrammeChange}
        onLevelChange={setLevelId}
      />

      <div className="split-grid split-grid--wide">
        <SectionCard
          title={pageContent[view].sectionTitle}
          subtitle="Search and status only refine already-scoped registrations."
          aside={
            <div className="table-toolbar">
              <input
                className="search-input"
                placeholder="Search student, matric number, or programme"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={!hasRequiredScope}
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={!hasRequiredScope || view !== 'queue'}>
                {view === 'queue' ? (
                  <>
                    <option value="all-queue">All queue statuses</option>
                    <option value="pending">Pending</option>
                    <option value="held">Held</option>
                    <option value="rejected">Rejected</option>
                    <option value="approved">Approved</option>
                  </>
                ) : view === 'approved' ? (
                  <option value="approved">Approved</option>
                ) : (
                  <option value="held">Held</option>
                )}
              </select>
            </div>
          }
        >
          {hasRequiredScope ? <DataTable data={registrations} columns={columns} /> : <div className="empty-state">{pageContent[view].sectionEmptyMessage}</div>}
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
                  <select value={addCourseId} onChange={(event) => setAddCourseId(event.target.value)}>
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
