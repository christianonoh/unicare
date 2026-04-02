import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getApplicantById, getReferenceData } from '../../data/services/universityData';
import type { EntryMode, Gender } from '../../types/domain';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { statusTone } from '../../lib/status';
import { toast } from '../../lib/toast';

interface ApplicantEditDraft {
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
  assignedOfficerId: string;
}

export function ApplicantDetailPage() {
  useDemoRevision();
  const { applicantId = '' } = useParams();
  const navigate = useNavigate();
  const { programmes, users } = getReferenceData();
  const detail = getApplicantById(applicantId);
  const cycleApplicantDocumentStatus = useDemoDataStore((state) => state.cycleApplicantDocumentStatus);
  const issueOffer = useDemoDataStore((state) => state.issueOffer);
  const markApplicantAccepted = useDemoDataStore((state) => state.markApplicantAccepted);
  const updateApplicant = useDemoDataStore((state) => state.updateApplicant);
  const updateApplicantClearance = useDemoDataStore((state) => state.updateApplicantClearance);
  const convertApplicantToStudent = useDemoDataStore((state) => state.convertApplicantToStudent);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [draft, setDraft] = useState<ApplicantEditDraft>({
    fullName: '',
    gender: 'Female' as const,
    stateOfOrigin: '',
    email: '',
    phone: '',
    entryMode: 'UTME' as const,
    programmeId: '',
    jambScore: 0,
    screeningScore: 0,
    notes: '',
    assignedOfficerId: '',
  });

  useEffect(() => {
    if (!detail) {
      return;
    }

    const { applicant } = detail;
    setDraft({
      fullName: applicant.fullName,
      gender: applicant.gender,
      stateOfOrigin: applicant.stateOfOrigin,
      email: applicant.email,
      phone: applicant.phone,
      entryMode: applicant.entryMode,
      programmeId: applicant.programmeId,
      jambScore: applicant.jambScore,
      screeningScore: applicant.screeningScore,
      notes: applicant.notes,
      assignedOfficerId: applicant.assignedOfficerId,
    });
  }, [
    detail?.applicant.id,
    detail?.applicant.fullName,
    detail?.applicant.gender,
    detail?.applicant.stateOfOrigin,
    detail?.applicant.email,
    detail?.applicant.phone,
    detail?.applicant.entryMode,
    detail?.applicant.programmeId,
    detail?.applicant.jambScore,
    detail?.applicant.screeningScore,
    detail?.applicant.notes,
    detail?.applicant.assignedOfficerId,
  ]);

  if (!detail) {
    return <div className="empty-state">Applicant not found in the current demo dataset.</div>;
  }

  const { applicant, faculty, department, programme, officer, invoice, linkedStudent } = detail;

  function handleResult(message: string, ok = true) {
    if (ok) {
      toast.success(message);
      return;
    }

    toast.error(message);
  }

  function handleDocumentCycle(documentName: string) {
    const result = cycleApplicantDocumentStatus(applicant.id, documentName);
    handleResult(result.message);
  }

  function handleConvert() {
    const result = convertApplicantToStudent(applicant.id);
    handleResult(result.message);
    if (result.ok && result.id) {
      navigate(`/students/records/${result.id}`);
    }
  }

  function handleSaveApplicant() {
    const result = updateApplicant(applicant.id, draft);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setShowEditModal(false);
    setFormError('');
    handleResult(result.message);
  }

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Applicant detail"
        title={applicant.fullName}
        description={`${programme?.name} • ${department?.name} • ${faculty?.name}`}
        actions={
          <div className="button-row">
            <button type="button" className="ghost-button" onClick={() => setShowEditModal(true)}>
              Edit record
            </button>
            {linkedStudent ? (
              <Link className="primary-button" to={`/students/records/${linkedStudent.id}`}>
                View student
              </Link>
            ) : (
              <button type="button" className="primary-button" onClick={handleConvert}>
                Convert to student
              </button>
            )}
          </div>
        }
      />

      <div className="split-grid">
        <SectionCard title="Journey status" subtitle="A leadership-facing summary of what still needs to happen before this applicant becomes a matriculated student.">
          <div className="timeline">
            <div className="timeline-item">
              <strong>Admission state</strong>
              <StatusBadge tone={statusTone(applicant.admissionStatus)} label={applicant.admissionStatus} />
            </div>
            <div className="timeline-item">
              <strong>Acceptance payment</strong>
              <StatusBadge tone={statusTone(applicant.acceptancePaymentStatus)} label={applicant.acceptancePaymentStatus} />
            </div>
            <div className="timeline-item">
              <strong>Clearance</strong>
              <StatusBadge tone={statusTone(applicant.clearanceStatus)} label={applicant.clearanceStatus} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Decision notes" subtitle={`Assigned officer: ${officer?.name ?? 'Registry'}`}>
          <p>{applicant.notes}</p>
          <div className="info-grid">
            <div>
              <span>JAMB score</span>
              <strong>{applicant.jambScore}</strong>
            </div>
            <div>
              <span>Screening score</span>
              <strong>{applicant.screeningScore}</strong>
            </div>
            <div>
              <span>Aggregate</span>
              <strong>{applicant.aggregateScore}</strong>
            </div>
            <div>
              <span>Offer date</span>
              <strong>{applicant.offerDate ? formatDate(applicant.offerDate) : 'Awaiting offer'}</strong>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Workflow actions" subtitle="These demo actions imitate the real admissions handoff from screening through conversion.">
        <div className="button-row">
          <button type="button" className="primary-button" onClick={() => handleResult(issueOffer(applicant.id).message)}>
            Issue offer
          </button>
          <button type="button" className="ghost-button" onClick={() => handleResult(markApplicantAccepted(applicant.id).message)}>
            Mark accepted
          </button>
          <button type="button" className="ghost-button" onClick={() => handleResult(updateApplicantClearance(applicant.id, 'pending').message)}>
            Set pending
          </button>
          <button type="button" className="ghost-button" onClick={() => handleResult(updateApplicantClearance(applicant.id, 'held').message)}>
            Hold clearance
          </button>
          <button type="button" className="ghost-button" onClick={() => handleResult(updateApplicantClearance(applicant.id, 'cleared').message)}>
            Clear applicant
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Verification checklist" subtitle="Documents and exceptions make the onboarding story tangible for non-technical stakeholders.">
        <div className="list-stack">
          {applicant.documents.map((document) => (
            <div key={document.name} className="list-row">
              <strong>{document.name}</strong>
              <div className="row-meta">
                <StatusBadge tone={statusTone(document.status)} label={document.status} />
                <button type="button" className="ghost-button ghost-button--sm" onClick={() => handleDocumentCycle(document.name)}>
                  Cycle status
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {invoice ? (
        <SectionCard title="Acceptance invoice" subtitle="A simplified fee experience for the admissions office and bursary view.">
          <div className="info-grid">
            <div>
              <span>Invoice number</span>
              <strong>{invoice.invoiceNumber}</strong>
            </div>
            <div>
              <span>Total amount</span>
              <strong>{formatCurrency(invoice.totalAmount)}</strong>
            </div>
            <div>
              <span>Paid</span>
              <strong>{formatCurrency(invoice.amountPaid)}</strong>
            </div>
            <div>
              <span>Status</span>
              <StatusBadge tone={statusTone(invoice.status)} label={invoice.status} />
            </div>
          </div>
        </SectionCard>
      ) : null}

      {showEditModal ? (
        <Modal
          title="Edit applicant"
          description="Use this to simulate registry corrections before offer issuance."
          onClose={() => {
            setShowEditModal(false);
            setFormError('');
          }}
          footer={
            <>
              <button type="button" className="ghost-button" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleSaveApplicant}>
                Save changes
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
                {programmes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Assigned officer</span>
              <select
                value={draft.assignedOfficerId}
                onChange={(event) => setDraft((current) => ({ ...current, assignedOfficerId: event.target.value }))}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
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
              <span>Notes</span>
              <textarea rows={4} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
          {formError ? <div className="note-callout note-callout--danger">{formError}</div> : null}
        </Modal>
      ) : null}
    </div>
  );
}
