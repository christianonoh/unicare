import { createColumnHelper } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { useLecturerStore } from '../../app/store/lecturerStore';
import { LecturerContextPanel } from '../../components/LecturerContextPanel';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  getReferenceData,
  getLecturerOverview,
  getRegistrationByStudentAndSemester,
  getStudentProfile,
  listLecturerAdvisees,
  listLecturerCourses,
  listLecturerRegistrationReviews,
  listLecturerResultEntries,
  listLecturers,
} from '../../data/services/universityData';
import { formatCurrency } from '../../lib/formatters';
import { statusTone } from '../../lib/status';
import { toast } from '../../lib/toast';
import type { RegistrationStatus } from '../../types/domain';

type LecturerView = 'directory' | 'overview' | 'load' | 'advisees' | 'assessment';
type AssessmentMode = 'score-entry' | 'adviser-review';
type LecturerDirectoryRow = ReturnType<typeof listLecturers>[number];
type LecturerCourseRow = ReturnType<typeof listLecturerCourses>[number];
type LecturerAdviseeRow = ReturnType<typeof listLecturerAdvisees>[number];
type LecturerResultRow = ReturnType<typeof listLecturerResultEntries>[number];
type LecturerReviewRow = ReturnType<typeof listLecturerRegistrationReviews>[number];

interface LecturerPageProps {
  view?: LecturerView;
}

const pageContent: Record<LecturerView, { title: string; description: string }> = {
  directory: {
    title: 'Lecturers directory',
    description: 'A browsable operational register of all lecturers, with faculty and department filtering before you enter an individual workspace.',
  },
  overview: {
    title: 'Lecturer overview',
    description: 'A compact teaching dashboard for the selected lecturer, combining load, advisees, result work, and adviser attention queues.',
  },
  load: {
    title: 'Teaching load',
    description: 'The assigned course ledger for the selected lecturer, with programme coverage, student volume, and result posture.',
  },
  advisees: {
    title: 'Advisees',
    description: 'An adviser-facing student register with finance signals, registration posture, and quick review actions.',
  },
  assessment: {
    title: 'Assessment & review',
    description: 'The operational lecturer workbench for score entry and adviser registration review.',
  },
};

function matchesAdviseeStatus(row: LecturerAdviseeRow, statusFilter: string) {
  if (statusFilter === 'all') {
    return true;
  }

  if (statusFilter === 'needs_attention') {
    return (
      row.hasFinancialHold ||
      row.registrationStatus === 'pending' ||
      row.registrationStatus === 'held' ||
      row.registrationStatus === 'rejected' ||
      row.adviserReview !== 'approved'
    );
  }

  return row.status === statusFilter;
}

export function LecturerPage({ view = 'overview' }: LecturerPageProps) {
  useDemoRevision();
  const navigate = useNavigate();
  const selectedLecturerId = useLecturerStore((state) => state.selectedLecturerId);
  const setSelectedLecturerId = useLecturerStore((state) => state.setSelectedLecturerId);
  const updateRegistrationReview = useDemoDataStore((state) => state.updateRegistrationReview);
  const updateResultEntry = useDemoDataStore((state) => state.updateResultEntry);
  const approveResult = useDemoDataStore((state) => state.approveResult);
  const { faculties, departments } = getReferenceData();
  const lecturers = listLecturers();
  const lecturer = lecturers.find((item) => item.id === selectedLecturerId) ?? lecturers[0] ?? null;
  const activeLecturerId = lecturer?.id ?? '';
  const overview = activeLecturerId ? getLecturerOverview(activeLecturerId) : null;
  const lecturerCourses = activeLecturerId ? listLecturerCourses(activeLecturerId) : [];
  const lecturerAdvisees = activeLecturerId ? listLecturerAdvisees(activeLecturerId) : [];
  const lecturerResultEntries = activeLecturerId ? listLecturerResultEntries(activeLecturerId) : [];
  const lecturerRegistrationReviews = activeLecturerId ? listLecturerRegistrationReviews(activeLecturerId) : [];
  const [directoryFacultyId, setDirectoryFacultyId] = useState('');
  const [directoryDepartmentId, setDirectoryDepartmentId] = useState('');
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [loadQuery, setLoadQuery] = useState('');
  const [loadStatusFilter, setLoadStatusFilter] = useState('all');
  const [adviseeQuery, setAdviseeQuery] = useState('');
  const [adviseeStatusFilter, setAdviseeStatusFilter] = useState('all');
  const [selectedAdviseeId, setSelectedAdviseeId] = useState<string | null>(null);
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('score-entry');
  const [scoreQuery, setScoreQuery] = useState('');
  const [scoreStatusFilter, setScoreStatusFilter] = useState('all');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [editCA, setEditCA] = useState(0);
  const [editExam, setEditExam] = useState(0);
  const [reviewQuery, setReviewQuery] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all');
  const [selectedReviewStudentId, setSelectedReviewStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!lecturers.length) {
      return;
    }

    if (!selectedLecturerId || !lecturers.some((item) => item.id === selectedLecturerId)) {
      setSelectedLecturerId(lecturers[0].id);
    }
  }, [lecturers, selectedLecturerId, setSelectedLecturerId]);

  const filteredDirectoryRows = lecturers.filter((entry) => {
    const normalizedQuery = directoryQuery.trim().toLowerCase();
    const matchesFaculty = !directoryFacultyId || entry.facultyId === directoryFacultyId;
    const matchesDepartment = !directoryDepartmentId || entry.departmentId === directoryDepartmentId;
    const matchesQuery =
      !normalizedQuery ||
      entry.name.toLowerCase().includes(normalizedQuery) ||
      entry.email.toLowerCase().includes(normalizedQuery) ||
      entry.phone.toLowerCase().includes(normalizedQuery) ||
      entry.facultyName.toLowerCase().includes(normalizedQuery) ||
      entry.departmentName.toLowerCase().includes(normalizedQuery);

    return matchesFaculty && matchesDepartment && matchesQuery;
  });

  const directoryDepartments = directoryFacultyId
    ? departments.filter((department) => department.facultyId === directoryFacultyId)
    : departments;

  const filteredCourses = lecturerCourses.filter((course) => {
    const normalizedQuery = loadQuery.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      course.code.toLowerCase().includes(normalizedQuery) ||
      course.title.toLowerCase().includes(normalizedQuery) ||
      course.programmeCoverage.toLowerCase().includes(normalizedQuery);
    const matchesStatus = loadStatusFilter === 'all' ? true : course.resultPosture === loadStatusFilter;

    return matchesQuery && matchesStatus;
  });

  const filteredAdvisees = lecturerAdvisees.filter((advisee) => {
    const normalizedQuery = adviseeQuery.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      advisee.studentName.toLowerCase().includes(normalizedQuery) ||
      advisee.matricNumber.toLowerCase().includes(normalizedQuery) ||
      advisee.programmeName.toLowerCase().includes(normalizedQuery);

    return matchesQuery && matchesAdviseeStatus(advisee, adviseeStatusFilter);
  });

  const filteredResultEntries = lecturerResultEntries.filter((entry) => {
    const normalizedQuery = scoreQuery.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      entry.studentName.toLowerCase().includes(normalizedQuery) ||
      entry.matricNumber.toLowerCase().includes(normalizedQuery) ||
      entry.courseCode.toLowerCase().includes(normalizedQuery) ||
      entry.courseTitle.toLowerCase().includes(normalizedQuery);
    const matchesStatus = scoreStatusFilter === 'all' ? true : entry.status === scoreStatusFilter;

    return matchesQuery && matchesStatus;
  });

  const filteredRegistrationReviews = lecturerRegistrationReviews.filter((review) => {
    const normalizedQuery = reviewQuery.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      review.studentName.toLowerCase().includes(normalizedQuery) ||
      review.matricNumber.toLowerCase().includes(normalizedQuery) ||
      review.programmeName.toLowerCase().includes(normalizedQuery);
    const matchesStatus = reviewStatusFilter === 'all' ? true : review.adviserReview === reviewStatusFilter;

    return matchesQuery && matchesStatus;
  });

  const selectedAdvisee = selectedAdviseeId ? filteredAdvisees.find((row) => row.studentId === selectedAdviseeId) : null;
  const selectedAdviseeProfile = selectedAdvisee ? getStudentProfile(selectedAdvisee.studentId) : null;
  const selectedAdviseeRegistration = selectedAdvisee ? getRegistrationByStudentAndSemester(selectedAdvisee.studentId) : null;
  const selectedResultRow = selectedResultId ? filteredResultEntries.find((row) => row.id === selectedResultId) : null;
  const selectedResultStudentProfile = selectedResultRow ? getStudentProfile(selectedResultRow.studentId) : null;
  const selectedReviewRow = selectedReviewStudentId ? filteredRegistrationReviews.find((row) => row.studentId === selectedReviewStudentId) : null;
  const selectedReviewRegistration = selectedReviewRow ? getRegistrationByStudentAndSemester(selectedReviewRow.studentId) : null;

  function resetLecturerSelections() {
    setSelectedAdviseeId(null);
    setSelectedResultId(null);
    setSelectedReviewStudentId(null);
    setEditCA(0);
    setEditExam(0);
  }

  function handleLecturerChange(value: string) {
    resetLecturerSelections();
    setSelectedLecturerId(value);
  }

  function openLecturerWorkspace(lecturerId: string) {
    resetLecturerSelections();
    setSelectedLecturerId(lecturerId);
    navigate('/lecturer/overview');
  }

  function handleSelectAdvisee(studentId: string) {
    setSelectedAdviseeId(studentId);
  }

  function handleSelectResult(row: LecturerResultRow) {
    setSelectedResultId(row.id);
    setEditCA(row.caScore);
    setEditExam(row.examScore);
  }

  function handleSelectReview(studentId: string) {
    setSelectedReviewStudentId(studentId);
  }

  function handleSaveResult() {
    if (!selectedResultRow) {
      return;
    }

    const result = updateResultEntry(selectedResultRow.id, editCA, editExam);
    if (result.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  }

  function handleApproveResult(resultId: string) {
    const result = approveResult(resultId);
    if (result.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  }

  function handleAdviserReview(registrationId: string | undefined, status: RegistrationStatus) {
    if (!registrationId) {
      toast.error('No active registration is available for this student.');
      return;
    }

    const result = updateRegistrationReview(registrationId, 'adviserReview', status);
    if (result.ok) {
      toast.success(result.message);
      return;
    }

    toast.error(result.message);
  }

  const loadColumns = [
    createColumnHelper<LecturerCourseRow>().accessor('code', { header: 'Course code', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerCourseRow>().accessor('title', { header: 'Course title', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerCourseRow>().accessor('levelName', { header: 'Level', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerCourseRow>().accessor('semesterName', { header: 'Semester', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerCourseRow>().accessor('programmeCoverage', { header: 'Programme coverage', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerCourseRow>().accessor('assignedStudentCount', { header: 'Students', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerCourseRow>().accessor('resultPosture', {
      header: 'Result posture',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  const adviseeColumns = [
    createColumnHelper<LecturerAdviseeRow>().accessor('studentName', {
      header: 'Student',
      cell: (info) => (
        <button type="button" className="link-button" onClick={() => handleSelectAdvisee(info.row.original.studentId)}>
          {info.getValue()}
        </button>
      ),
    }),
    createColumnHelper<LecturerAdviseeRow>().accessor('matricNumber', { header: 'Matric no', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerAdviseeRow>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerAdviseeRow>().accessor('levelName', { header: 'Level', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerAdviseeRow>().accessor('status', {
      header: 'Student status',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
    createColumnHelper<LecturerAdviseeRow>().accessor('adviserReview', {
      header: 'Adviser review',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  const resultColumns = [
    createColumnHelper<LecturerResultRow>().accessor('studentName', {
      header: 'Student',
      cell: (info) => (
        <button type="button" className="link-button" onClick={() => handleSelectResult(info.row.original)}>
          {info.getValue()}
        </button>
      ),
    }),
    createColumnHelper<LecturerResultRow>().accessor('courseCode', { header: 'Course', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerResultRow>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerResultRow>().accessor('levelName', { header: 'Level', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerResultRow>().accessor('totalScore', { header: 'Score', cell: (info) => `${info.getValue()} (${info.row.original.grade})` }),
    createColumnHelper<LecturerResultRow>().accessor('status', {
      header: 'Approval state',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  const reviewColumns = [
    createColumnHelper<LecturerReviewRow>().accessor('studentName', {
      header: 'Student',
      cell: (info) => (
        <button type="button" className="link-button" onClick={() => handleSelectReview(info.row.original.studentId)}>
          {info.getValue()}
        </button>
      ),
    }),
    createColumnHelper<LecturerReviewRow>().accessor('matricNumber', { header: 'Matric no', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerReviewRow>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerReviewRow>().accessor('levelName', { header: 'Level', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerReviewRow>().accessor('status', {
      header: 'Registration',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
    createColumnHelper<LecturerReviewRow>().accessor('adviserReview', {
      header: 'Adviser review',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  const directoryColumns = [
    createColumnHelper<LecturerDirectoryRow>().accessor('name', {
      header: 'Lecturer',
      cell: (info) => (
        <button type="button" className="link-button" onClick={() => openLecturerWorkspace(info.row.original.id)}>
          {info.getValue()}
        </button>
      ),
    }),
    createColumnHelper<LecturerDirectoryRow>().accessor('facultyName', { header: 'Faculty', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerDirectoryRow>().accessor('departmentName', { header: 'Department', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerDirectoryRow>().accessor('email', { header: 'Email', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerDirectoryRow>().accessor('phone', { header: 'Phone', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerDirectoryRow>().accessor('courseCount', { header: 'Courses', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerDirectoryRow>().accessor('adviseeCount', { header: 'Advisees', cell: (info) => info.getValue() }),
    createColumnHelper<LecturerDirectoryRow>().display({
      id: 'workspace',
      header: 'Action',
      cell: (info) => (
        <button type="button" className="ghost-button ghost-button--sm" onClick={() => openLecturerWorkspace(info.row.original.id)}>
          Open workspace
        </button>
      ),
    }),
  ];

  if (!lecturers.length) {
    return <div className="empty-state">No lecturer accounts are available in this demo dataset yet.</div>;
  }

  const contextSummary =
    view === 'directory'
      ? {
          label: 'lecturers listed',
          count: filteredDirectoryRows.length,
          meta: 'Use faculty, department, and search to narrow the directory before opening a lecturer workspace.',
        }
      : view === 'overview'
      ? {
          label: 'items needing follow-up',
          count: (overview?.resultRowsAwaitingAction ?? 0) + (overview?.registrationsNeedingReview ?? 0),
          meta: 'This rolls up open score-entry work and adviser review attention for the selected lecturer.',
        }
      : view === 'load'
        ? {
            label: 'assigned courses',
            count: lecturerCourses.length,
            meta: 'Search and result posture only refine the lecturer-owned course ledger below.',
          }
        : view === 'advisees'
          ? {
              label: 'advisees in scope',
              count: lecturerAdvisees.length,
              meta: 'Search and student-status filters only refine this lecturer’s advisee register.',
            }
          : assessmentMode === 'score-entry'
            ? {
                label: 'result rows in scope',
                count: lecturerResultEntries.length,
                meta: 'Score entry stays limited to courses owned by the selected lecturer.',
              }
            : {
                label: 'registrations in scope',
                count: lecturerRegistrationReviews.length,
                meta: 'Adviser review stays limited to students assigned to the selected lecturer.',
              };

  return (
    <div className="page-grid">
      <PageHeader title={pageContent[view].title} description={pageContent[view].description} />

      {view === 'directory' ? (
        <SectionCard title="Browse lecturers" subtitle="Discovery filters help narrow the staff list before you step into one lecturer’s operational workspace.">
          <div className="form-grid">
            <label className="field-group">
              <span>Faculty</span>
              <select
                value={directoryFacultyId}
                onChange={(event) => {
                  setDirectoryFacultyId(event.target.value);
                  setDirectoryDepartmentId('');
                }}
              >
                <option value="">All faculties</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>Department</span>
              <select value={directoryDepartmentId} onChange={(event) => setDirectoryDepartmentId(event.target.value)}>
                <option value="">{directoryFacultyId ? 'All departments in faculty' : 'All departments'}</option>
                {directoryDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </SectionCard>
      ) : (
        <LecturerContextPanel
          title="Active lecturer"
          description="Switch lecturer context to demo teaching load, advisee ownership, score entry, and adviser review without changing global app state."
          lecturers={lecturers.map((item) => ({ id: item.id, label: item.name }))}
          selectedLecturerId={activeLecturerId}
          selectedLecturer={lecturer}
          summaryLabel={contextSummary.label}
          summaryCount={contextSummary.count}
          summaryMeta={contextSummary.meta}
          onLecturerChange={handleLecturerChange}
        />
      )}

      {view === 'directory' ? (
        <SectionCard
          title="Lecturers directory"
          subtitle="Search refines the already-browsable lecturer register and lets you jump straight into any lecturer workspace."
          aside={
            <div className="table-toolbar">
              <input
                className="search-input"
                placeholder="Search lecturer, email, phone, faculty, or department"
                value={directoryQuery}
                onChange={(event) => setDirectoryQuery(event.target.value)}
              />
            </div>
          }
        >
          <DataTable data={filteredDirectoryRows} columns={directoryColumns} exportFilename="lecturers-directory" />
        </SectionCard>
      ) : null}

      {view === 'overview' ? (
        <>
          <div className="stats-grid">
            <StatCard label="Assigned courses" value={String(overview?.assignedCourses ?? 0)} meta="Live course ownership for the selected lecturer." />
            <StatCard label="Advisees" value={String(overview?.advisees ?? 0)} meta="Students directly assigned to this lecturer as adviser." />
            <StatCard label="Result rows awaiting action" value={String(overview?.resultRowsAwaitingAction ?? 0)} meta="All non-published score rows still requiring lecturer-side attention." />
            <StatCard label="Registrations needing review" value={String(overview?.registrationsNeedingReview ?? 0)} meta="Advisee registrations still pending adviser attention or blocked by holds." />
          </div>

          <div className="split-grid">
            <SectionCard title="Courses needing result attention" subtitle="Short queue of lecturer-owned courses where score work is still open.">
              <div className="list-stack">
                {overview?.courseQueue.length ? (
                  overview.courseQueue.map((course) => (
                    <div key={course.id} className="list-row">
                      <div>
                        <strong>{course.code}</strong>
                        <p>{course.title}</p>
                      </div>
                      <div className="row-meta">
                        <span>{course.pendingResultCount} open rows</span>
                        <StatusBadge tone={statusTone(course.resultPosture)} label={course.resultPosture} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No lecturer-owned courses are waiting on result work right now.</div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Advisees needing follow-up" subtitle="Students with pending adviser review, finance holds, or unresolved registration posture.">
              <div className="list-stack">
                {overview?.adviseeQueue.length ? (
                  overview.adviseeQueue.map((advisee) => (
                    <div key={advisee.studentId} className="list-row">
                      <div>
                        <strong>{advisee.studentName}</strong>
                        <p>{advisee.programmeName}</p>
                      </div>
                      <div className="row-meta">
                        {advisee.hasFinancialHold ? <StatusBadge tone="held" label="financial hold" /> : null}
                        <StatusBadge tone={statusTone(advisee.adviserReview)} label={advisee.adviserReview} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No advisees currently need lecturer follow-up.</div>
                )}
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}

      {view === 'load' ? (
        <SectionCard
          title="Teaching load ledger"
          subtitle="Search and status only refine courses already assigned to the selected lecturer."
          aside={
            <div className="table-toolbar">
              <input
                className="search-input"
                placeholder="Search course code, title, or programme"
                value={loadQuery}
                onChange={(event) => setLoadQuery(event.target.value)}
              />
              <select value={loadStatusFilter} onChange={(event) => setLoadStatusFilter(event.target.value)}>
                <option value="all">All result postures</option>
                <option value="not_submitted">Not submitted</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
              </select>
            </div>
          }
        >
          <DataTable data={filteredCourses} columns={loadColumns} exportFilename="lecturer-teaching-load" />
        </SectionCard>
      ) : null}

      {view === 'advisees' ? (
        <div className="split-grid split-grid--wide">
          <SectionCard
            title="Advisee register"
            subtitle="Search and status refine the students already assigned to this lecturer."
            aside={
              <div className="table-toolbar">
                <input
                  className="search-input"
                  placeholder="Search student, matric number, or programme"
                  value={adviseeQuery}
                  onChange={(event) => setAdviseeQuery(event.target.value)}
                />
                <select value={adviseeStatusFilter} onChange={(event) => setAdviseeStatusFilter(event.target.value)}>
                  <option value="all">All student statuses</option>
                  <option value="needs_attention">Needs attention</option>
                  <option value="active">Active</option>
                  <option value="probation">Probation</option>
                  <option value="deferred">Deferred</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            }
          >
            <DataTable data={filteredAdvisees} columns={adviseeColumns} exportFilename="lecturer-advisees" />
          </SectionCard>

          <SectionCard title="Advisee detail" subtitle="Registration summary, finance posture, and quick adviser actions for the selected student.">
            {selectedAdvisee && selectedAdviseeProfile ? (
              <>
                <div className="info-grid">
                  <div>
                    <span>Student status</span>
                    <StatusBadge tone={statusTone(selectedAdvisee.status)} label={selectedAdvisee.status} />
                  </div>
                  <div>
                    <span>Clearance</span>
                    <StatusBadge tone={statusTone(selectedAdvisee.clearanceStatus)} label={selectedAdvisee.clearanceStatus} />
                  </div>
                  <div>
                    <span>Registration</span>
                    <StatusBadge tone={statusTone(selectedAdvisee.registrationStatus)} label={selectedAdvisee.registrationStatus} />
                  </div>
                  <div>
                    <span>Outstanding balance</span>
                    <strong>{formatCurrency(selectedAdvisee.outstandingBalance)}</strong>
                  </div>
                </div>

                {selectedAdvisee.hasFinancialHold ? (
                  <p className="note-callout note-callout--danger">Finance has an outstanding balance on this advisee, so registration may remain blocked until payment is posted.</p>
                ) : (
                  <p className="note-callout note-callout--info">No finance blocker is currently attached to this advisee’s current registration.</p>
                )}

                <div className="button-row" style={{ padding: '8px 0' }}>
                  <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleAdviserReview(selectedAdvisee.registrationId, 'approved')}>
                    Adviser approve
                  </button>
                  <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleAdviserReview(selectedAdvisee.registrationId, 'held')}>
                    Place on hold
                  </button>
                  <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleAdviserReview(selectedAdvisee.registrationId, 'rejected')}>
                    Reject
                  </button>
                </div>

                <div className="list-stack">
                  {selectedAdviseeRegistration?.items.length ? (
                    selectedAdviseeRegistration.items.map((item) => (
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
                    ))
                  ) : (
                    <div className="empty-state">No current registration items are available for this advisee.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">Select an advisee from the table to inspect registration posture and adviser actions.</div>
            )}
          </SectionCard>
        </div>
      ) : null}

      {view === 'assessment' ? (
        <>
          <div className="tab-row">
            <button
              type="button"
              className={assessmentMode === 'score-entry' ? 'tab-button is-active' : 'tab-button'}
              onClick={() => setAssessmentMode('score-entry')}
            >
              Score entry
            </button>
            <button
              type="button"
              className={assessmentMode === 'adviser-review' ? 'tab-button is-active' : 'tab-button'}
              onClick={() => setAssessmentMode('adviser-review')}
            >
              Adviser review
            </button>
          </div>

          {assessmentMode === 'score-entry' ? (
            <div className="split-grid split-grid--wide">
              <SectionCard
                title="Score-entry queue"
                subtitle="Search and status only refine result rows for courses owned by the selected lecturer."
                aside={
                  <div className="table-toolbar">
                    <input
                      className="search-input"
                      placeholder="Search student, matric number, or course"
                      value={scoreQuery}
                      onChange={(event) => setScoreQuery(event.target.value)}
                    />
                    <select value={scoreStatusFilter} onChange={(event) => setScoreStatusFilter(event.target.value)}>
                      <option value="all">All result states</option>
                      <option value="not_submitted">Not submitted</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                }
              >
                <DataTable data={filteredResultEntries} columns={resultColumns} exportFilename="lecturer-score-entry" />
              </SectionCard>

              <SectionCard title="Selected score sheet" subtitle="Edit CA and exam scores, then progress the selected row through the approval flow.">
                {selectedResultRow && selectedResultStudentProfile ? (
                  <>
                    <div className="info-grid">
                      <div>
                        <span>Student</span>
                        <strong>{selectedResultRow.studentName}</strong>
                      </div>
                      <div>
                        <span>Course</span>
                        <strong>{selectedResultRow.courseCode}</strong>
                      </div>
                      <div>
                        <span>Current state</span>
                        <StatusBadge tone={statusTone(selectedResultRow.status)} label={selectedResultRow.status} />
                      </div>
                      <div>
                        <span>Carryover</span>
                        <StatusBadge tone={selectedResultRow.carryover ? 'carryover' : 'approved'} label={selectedResultRow.carryover ? 'carryover' : 'clear'} />
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: 8 }}>
                      <label className="field-group">
                        <span>CA score</span>
                        <input type="number" min={0} max={40} value={editCA} onChange={(event) => setEditCA(Number(event.target.value))} />
                      </label>
                      <label className="field-group">
                        <span>Exam score</span>
                        <input type="number" min={0} max={60} value={editExam} onChange={(event) => setEditExam(Number(event.target.value))} />
                      </label>
                    </div>

                    <div className="button-row" style={{ padding: '8px 0' }}>
                      <button type="button" className="primary-button" onClick={handleSaveResult}>
                        Save scores
                      </button>
                      <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleApproveResult(selectedResultRow.id)}>
                        {selectedResultRow.status === 'approved' ? 'Publish result' : 'Approve result'}
                      </button>
                    </div>

                    <div className="list-stack">
                      <div className="list-row">
                        <div>
                          <strong>{selectedResultStudentProfile.student.fullName}</strong>
                          <p>{selectedResultRow.programmeName} • {selectedResultRow.levelName}</p>
                        </div>
                        <div className="row-meta">
                          <span>{selectedResultStudentProfile.student.matricNumber}</span>
                          <StatusBadge tone={statusTone(selectedResultStudentProfile.student.status)} label={selectedResultStudentProfile.student.status} />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">Select a result row from the left table to edit or progress it.</div>
                )}
              </SectionCard>
            </div>
          ) : (
            <div className="split-grid split-grid--wide">
              <SectionCard
                title="Adviser review queue"
                subtitle="Search and status only refine registrations that belong to students advised by this lecturer."
                aside={
                  <div className="table-toolbar">
                    <input
                      className="search-input"
                      placeholder="Search student, matric number, or programme"
                      value={reviewQuery}
                      onChange={(event) => setReviewQuery(event.target.value)}
                    />
                    <select value={reviewStatusFilter} onChange={(event) => setReviewStatusFilter(event.target.value)}>
                      <option value="all">All adviser states</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="held">Held</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                }
              >
                <DataTable data={filteredRegistrationReviews} columns={reviewColumns} exportFilename="lecturer-adviser-review" />
              </SectionCard>

              <SectionCard title="Selected registration review" subtitle="Inspect the advisee’s current registration and take adviser actions from one place.">
                {selectedReviewRow && selectedReviewRegistration ? (
                  <>
                    <div className="info-grid">
                      <div>
                        <span>Registration</span>
                        <StatusBadge tone={statusTone(selectedReviewRow.status)} label={selectedReviewRow.status} />
                      </div>
                      <div>
                        <span>Adviser review</span>
                        <StatusBadge tone={statusTone(selectedReviewRow.adviserReview)} label={selectedReviewRow.adviserReview} />
                      </div>
                      <div>
                        <span>HOD review</span>
                        <StatusBadge tone={statusTone(selectedReviewRow.hodReview)} label={selectedReviewRow.hodReview} />
                      </div>
                      <div>
                        <span>Outstanding balance</span>
                        <strong>{formatCurrency(selectedReviewRow.outstandingBalance)}</strong>
                      </div>
                    </div>

                    {selectedReviewRow.hasFinancialHold ? (
                      <p className="note-callout note-callout--danger">This registration still carries a finance hold, so adviser approval may not clear the full workflow.</p>
                    ) : (
                      <p className="note-callout note-callout--info">No finance hold is currently blocking this registration.</p>
                    )}

                    <div className="button-row" style={{ padding: '8px 0' }}>
                      <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleAdviserReview(selectedReviewRow.id, 'approved')}>
                        Adviser approve
                      </button>
                      <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleAdviserReview(selectedReviewRow.id, 'held')}>
                        Place on hold
                      </button>
                      <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleAdviserReview(selectedReviewRow.id, 'rejected')}>
                        Reject
                      </button>
                    </div>

                    <div className="list-stack">
                      {selectedReviewRegistration.items.map((item) => (
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
                  <div className="empty-state">Select a registration row from the left table to inspect and review it.</div>
                )}
              </SectionCard>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
