import { createColumnHelper } from '@tanstack/react-table';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { AcademicScopePanel } from '../../components/AcademicScopePanel';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { getAcademicScopeOptions, getReferenceData, listApplicants, matchesAcademicScope } from '../../data/services/universityData';
import type { EntryMode, Gender } from '../../types/domain';
import { toast } from '../../lib/toast';
import { statusTone } from '../../lib/status';

type AdmissionsView = 'applications' | 'clearance';

interface AdmissionsPageProps {
  view?: AdmissionsView;
}

interface ApplicantDraft {
  fullName: string;
  gender: Gender;
  stateOfOrigin: string;
  email: string;
  phone: string;
  entryMode: EntryMode;
  programmeId: string;
  jambScore: number;
  screeningScore: number;
  notes: string;
}

const clearanceStatuses = new Set(['pending', 'held', 'queried']);

export function AdmissionsPage({ view = 'applications' }: AdmissionsPageProps) {
  useDemoRevision();
  const navigate = useNavigate();
  const { programmes } = getReferenceData();
  const createApplicant = useDemoDataStore((state) => state.createApplicant);
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [statusFilter, setStatusFilter] = useState(view === 'clearance' ? 'queue' : 'all');
  const [query, setQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formError, setFormError] = useState('');
  const defaultProgrammeId = programmes[0]?.id ?? '';
  const [draft, setDraft] = useState<ApplicantDraft>({
    fullName: '',
    gender: 'Female' as const,
    stateOfOrigin: 'Lagos',
    email: '',
    phone: '',
    entryMode: 'UTME' as const,
    programmeId: defaultProgrammeId,
    jambScore: 220,
    screeningScore: 62,
    notes: '',
  });
  const pageContent: Record<
    AdmissionsView,
    { eyebrow: string; title: string; description: string; sectionTitle: string; sectionEmptyMessage: string }
  > = {
    applications: {
      eyebrow: 'Admissions operations',
      title: 'Applications',
      description: 'One admissions workbench for application review, offer follow-up, and conversion visibility across the academic structure.',
      sectionTitle: 'Admissions pipeline',
      sectionEmptyMessage: 'Choose a faculty and department to load applications.',
    },
    clearance: {
      eyebrow: 'Admissions operations',
      title: 'Clearance',
      description: 'A scoped admissions exception queue for verification and onboarding blockers that need active intervention.',
      sectionTitle: 'Clearance queue',
      sectionEmptyMessage: 'Choose a faculty and department to load clearance cases.',
    },
  };

  const { faculties, departments, programmes: scopedProgrammes, levels } = getAcademicScopeOptions({ facultyId, departmentId });
  const hasRequiredScope = Boolean(facultyId && departmentId);
  const allApplicants = listApplicants();
  const scopedApplicants = allApplicants.filter((applicant) => {
    const matchesView = view === 'clearance' ? clearanceStatuses.has(applicant.clearanceStatus) : true;

    return matchesView && matchesAcademicScope(applicant, { facultyId, departmentId, programmeId, levelId });
  });
  const applicants = scopedApplicants.filter((applicant) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      applicant.fullName.toLowerCase().includes(normalizedQuery) ||
      applicant.programmeName.toLowerCase().includes(normalizedQuery) ||
      applicant.applicationNumber.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      view === 'clearance'
        ? statusFilter === 'queue' || statusFilter === 'all'
          ? clearanceStatuses.has(applicant.clearanceStatus)
          : applicant.clearanceStatus === statusFilter
        : statusFilter === 'all'
          ? true
          : applicant.admissionStatus === statusFilter;

    return matchesQuery && matchesStatus;
  });
  const selectedProgramme = useMemo(
    () => programmes.find((programme) => programme.id === draft.programmeId),
    [draft.programmeId, programmes],
  );

  const columns = [
    createColumnHelper<(typeof applicants)[number]>().accessor('fullName', {
      header: 'Applicant',
      cell: (info) => <Link to={`/admissions/applications/${info.row.original.id}`}>{info.getValue()}</Link>,
    }),
    createColumnHelper<(typeof applicants)[number]>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof applicants)[number]>().accessor('aggregateScore', { header: 'Aggregate', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof applicants)[number]>().accessor('admissionStatus', {
      header: 'Admission',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
    createColumnHelper<(typeof applicants)[number]>().accessor('clearanceStatus', {
      header: 'Clearance',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  function resetDraft() {
    setDraft({
      fullName: '',
      gender: 'Female',
      stateOfOrigin: 'Lagos',
      email: '',
      phone: '',
      entryMode: 'UTME',
      programmeId: defaultProgrammeId,
      jambScore: 220,
      screeningScore: 62,
      notes: '',
    });
    setFormError('');
  }

  function handleCreateApplicant() {
    if (!draft.fullName || !draft.email || !draft.programmeId) {
      setFormError('Full name, email, and programme are required.');
      return;
    }

    const result = createApplicant(draft);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setShowCreateModal(false);
    resetDraft();
    toast.success('Applicant created successfully.');
    navigate(`/admissions/applications/${result.id}`);
  }

  function handleFacultyChange(value: string) {
    setFacultyId(value);
    setDepartmentId('');
    setProgrammeId('');
    setLevelId('');
  }

  function handleDepartmentChange(value: string) {
    setDepartmentId(value);
    setProgrammeId('');
    setLevelId('');
  }

  function handleProgrammeChange(value: string) {
    setProgrammeId(value);
    setLevelId('');
  }

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow={pageContent[view].eyebrow}
        title={pageContent[view].title}
        description={pageContent[view].description}
        actions={
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              resetDraft();
              setShowCreateModal(true);
            }}
          >
            New application
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Screening queue" value={String(allApplicants.filter((item) => item.admissionStatus === 'screening').length)} meta="Applications still being reviewed by admissions and departments." />
        <StatCard label="Offers issued" value={String(allApplicants.filter((item) => item.admissionStatus === 'offered').length)} meta="Candidates with offers but incomplete onboarding." />
        <StatCard label="Accepted" value={String(allApplicants.filter((item) => item.admissionStatus === 'accepted').length)} meta="Freshers most likely to convert into student records." />
        <StatCard label="Held clearance" value={String(allApplicants.filter((item) => item.clearanceStatus === 'held').length)} meta="Cases with verification or payment blockers." />
      </div>

      <AcademicScopePanel
        title="Academic scope"
        description="Choose where the admissions workload belongs before loading rows into the workbench."
        facultyId={facultyId}
        departmentId={departmentId}
        programmeId={programmeId}
        levelId={levelId}
        faculties={faculties.map((faculty) => ({ id: faculty.id, label: faculty.name }))}
        departments={departments.map((department) => ({ id: department.id, label: department.name }))}
        programmes={scopedProgrammes.map((programme) => ({ id: programme.id, label: `${programme.award} ${programme.name}` }))}
        levels={levels.map((level) => ({ id: level.id, label: level.name }))}
        resultLabel={view === 'clearance' ? 'clearance cases in scope' : 'applications in scope'}
        resultCount={hasRequiredScope ? scopedApplicants.length : 0}
        resultMeta="Page-level scope narrows the queue before search or status refinement."
        emptyMessage={pageContent[view].sectionEmptyMessage}
        onFacultyChange={handleFacultyChange}
        onDepartmentChange={handleDepartmentChange}
        onProgrammeChange={handleProgrammeChange}
        onLevelChange={setLevelId}
      />

      <SectionCard
        title={pageContent[view].sectionTitle}
        subtitle="Search and status only refine the scoped queue."
        aside={
          <div className="table-toolbar">
            <input
              className="search-input"
              placeholder="Search applicant, application number, or programme"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={!hasRequiredScope}
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={!hasRequiredScope}>
              {view === 'clearance' ? (
                <>
                  <option value="queue">All clearance cases</option>
                  <option value="pending">Pending</option>
                  <option value="held">Held</option>
                  <option value="queried">Queried</option>
                  <option value="cleared">Cleared</option>
                </>
              ) : (
                <>
                  <option value="all">All statuses</option>
                  <option value="screening">Screening</option>
                  <option value="offered">Offered</option>
                  <option value="accepted">Accepted</option>
                  <option value="deferred">Deferred</option>
                  <option value="declined">Declined</option>
                </>
              )}
            </select>
          </div>
        }
      >
        {hasRequiredScope ? <DataTable data={applicants} columns={columns} exportFilename="applications" /> : <div className="empty-state">{pageContent[view].sectionEmptyMessage}</div>}
      </SectionCard>

      {showCreateModal ? (
        <Modal
          title="Create applicant"
          description="This phase-2 form simulates a real admissions intake flow using local demo data."
          onClose={() => setShowCreateModal(false)}
          footer={
            <>
              <button type="button" className="ghost-button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleCreateApplicant}>
                Save applicant
              </button>
            </>
          }
        >
          <div className="form-grid">
            <label className="field-group">
              <span>Full name</span>
              <input value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Email</span>
              <input value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Phone</span>
              <input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>State of origin</span>
              <input value={draft.stateOfOrigin} onChange={(event) => setDraft((current) => ({ ...current, stateOfOrigin: event.target.value }))} />
            </label>
            <label className="field-group">
              <span>Gender</span>
              <select value={draft.gender} onChange={(event) => setDraft((current) => ({ ...current, gender: event.target.value as 'Male' | 'Female' }))}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </label>
            <label className="field-group">
              <span>Entry mode</span>
              <select value={draft.entryMode} onChange={(event) => setDraft((current) => ({ ...current, entryMode: event.target.value as 'UTME' | 'Direct Entry' | 'Transfer' }))}>
                <option value="UTME">UTME</option>
                <option value="Direct Entry">Direct Entry</option>
                <option value="Transfer">Transfer</option>
              </select>
            </label>
            <label className="field-group">
              <span>Programme</span>
              <select value={draft.programmeId} onChange={(event) => setDraft((current) => ({ ...current, programmeId: event.target.value }))}>
                {programmes.map((programme) => (
                  <option key={programme.id} value={programme.id}>
                    {programme.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>JAMB score</span>
              <input
                type="number"
                value={draft.jambScore}
                onChange={(event) => setDraft((current) => ({ ...current, jambScore: Number(event.target.value) }))}
              />
            </label>
            <label className="field-group">
              <span>Screening score</span>
              <input
                type="number"
                value={draft.screeningScore}
                onChange={(event) => setDraft((current) => ({ ...current, screeningScore: Number(event.target.value) }))}
              />
            </label>
            <div className="readonly-field">
              Target programme: {selectedProgramme ? `${selectedProgramme.award} ${selectedProgramme.name}` : 'Select a programme'}
            </div>
            <label className="field-group field-group--full">
              <span>Notes</span>
              <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
          {formError ? <div className="note-callout note-callout--danger">{formError}</div> : null}
        </Modal>
      ) : null}
    </div>
  );
}
