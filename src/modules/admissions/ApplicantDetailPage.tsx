import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getApplicantById } from '../../data/services/universityData';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { statusTone } from '../../lib/status';

export function ApplicantDetailPage() {
  const { applicantId = '' } = useParams();
  const detail = getApplicantById(applicantId);

  if (!detail) {
    return <div className="empty-state">Applicant not found in the current demo dataset.</div>;
  }

  const { applicant, faculty, department, programme, officer, invoice } = detail;

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Applicant detail"
        title={applicant.fullName}
        description={`${programme?.name} • ${department?.name} • ${faculty?.name}`}
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

      <SectionCard title="Verification checklist" subtitle="Documents and exceptions make the onboarding story tangible for non-technical stakeholders.">
        <div className="list-stack">
          {applicant.documents.map((document) => (
            <div key={document.name} className="list-row">
              <strong>{document.name}</strong>
              <StatusBadge tone={statusTone(document.status)} label={document.status} />
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
    </div>
  );
}
