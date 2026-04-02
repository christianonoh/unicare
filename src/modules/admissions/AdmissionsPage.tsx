import { createColumnHelper } from '@tanstack/react-table';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { getReferenceData, listApplicants } from '../../data/services/universityData';
import type { EntryMode, Gender } from '../../types/domain';
import { toast } from '../../lib/toast';
import { statusTone } from '../../lib/status';

type RegistryView = 'applicants' | 'offers' | 'clearance';

interface AdmissionsPageProps {
  view?: RegistryView;
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

export function AdmissionsPage({ view = 'applicants' }: AdmissionsPageProps) {
  useDemoRevision();
  const navigate = useNavigate();
  const { programmes } = getReferenceData();
  const createApplicant = useDemoDataStore((state) => state.createApplicant);
  const [statusFilter, setStatusFilter] = useState(view === 'offers' ? 'offered' : 'all');
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
  const pageContent: Record<RegistryView, { eyebrow: string; title: string; description: string; sectionTitle: string; sectionSubtitle: string }> = {
    applicants: {
      eyebrow: 'Registry operations',
      title: 'Applicants',
      description: 'Track the full admissions pipeline from screening to offer, acceptance payment, and final registry clearance.',
      sectionTitle: 'Applicant workbench',
      sectionSubtitle: 'The full applicant list, searchable and filterable like a real registry queue.',
    },
    offers: {
      eyebrow: 'Registry operations',
      title: 'Admission offers',
      description: 'Focus on candidates who are either already offered admission or close enough to require active registry follow-up.',
      sectionTitle: 'Offer management',
      sectionSubtitle: 'Candidates who need offer issuance, acceptance follow-up, or conversion monitoring.',
    },
    clearance: {
      eyebrow: 'Registry operations',
      title: 'Clearance queue',
      description: 'Highlight applicants blocked by document verification, payment posture, or unresolved onboarding exceptions.',
      sectionTitle: 'Clearance exceptions',
      sectionSubtitle: 'The queue most likely to require coordinated action between registry and bursary.',
    },
  };
  const applicants = listApplicants().filter((applicant) => {
    const matchesView =
      view === 'offers'
        ? applicant.admissionStatus === 'offered' || applicant.admissionStatus === 'accepted'
        : view === 'clearance'
          ? applicant.clearanceStatus === 'pending' || applicant.clearanceStatus === 'held' || applicant.clearanceStatus === 'queried'
          : true;
    const matchesStatus = statusFilter === 'all' ? true : applicant.admissionStatus === statusFilter;
    const matchesQuery =
      applicant.fullName.toLowerCase().includes(query.toLowerCase()) ||
      applicant.programmeName.toLowerCase().includes(query.toLowerCase());

    return matchesView && matchesStatus && matchesQuery;
  });
  const selectedProgramme = useMemo(
    () => programmes.find((programme) => programme.id === draft.programmeId),
    [draft.programmeId, programmes],
  );

  const columns = [
    createColumnHelper<(typeof applicants)[number]>().accessor('fullName', {
      header: 'Applicant',
      cell: (info) => <Link to={`/registry/applicants/${info.row.original.id}`}>{info.getValue()}</Link>,
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
    navigate(`/registry/applicants/${result.id}`);
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
            New applicant
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Screening queue" value={String(listApplicants().filter((item) => item.admissionStatus === 'screening').length)} meta="Applications still being reviewed by registry and departments." />
        <StatCard label="Offers issued" value={String(listApplicants().filter((item) => item.admissionStatus === 'offered').length)} meta="Candidates with offers but incomplete onboarding." />
        <StatCard label="Accepted" value={String(listApplicants().filter((item) => item.admissionStatus === 'accepted').length)} meta="Freshers likely to convert into student records." />
        <StatCard label="Held clearance" value={String(listApplicants().filter((item) => item.clearanceStatus === 'held').length)} meta="Cases with verification or payment blockers." />
      </div>

      <SectionCard
        title={pageContent[view].sectionTitle}
        subtitle={pageContent[view].sectionSubtitle}
        aside={
          <div className="filters-inline">
            <input className="search-input" placeholder="Search applicant or programme" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="screening">Screening</option>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted</option>
              <option value="deferred">Deferred</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        }
      >
        <DataTable data={applicants} columns={columns} exportFilename="applicants" />
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
            <label className="field-group field-group--full">
              <span>Registry notes</span>
              <textarea
                rows={4}
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              />
            </label>
          </div>

          {selectedProgramme ? (
            <div className="note-callout note-callout--info">
              Applicant will be created under <strong>{selectedProgramme.name}</strong>.
            </div>
          ) : null}
          {formError ? <div className="note-callout note-callout--danger">{formError}</div> : null}
        </Modal>
      ) : null}
    </div>
  );
}
