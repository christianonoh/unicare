import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getStudentProfile } from '../../data/services/universityData';
import { formatCurrency } from '../../lib/formatters';
import { statusTone } from '../../lib/status';

export function StudentDetailPage() {
  const { studentId = '' } = useParams();
  const detail = getStudentProfile(studentId);
  const [tab, setTab] = useState<'profile' | 'finance' | 'registration' | 'results'>('profile');

  if (!detail) {
    return <div className="empty-state">Student profile not found in the seed set.</div>;
  }

  const { student, programme, department, faculty, adviser, financialPosition, registration, invoices, results, gpa } = detail;

  return (
    <div className="page-grid">
      <PageHeader eyebrow="Student detail" title={student.fullName} description={`${student.matricNumber} • ${programme?.name} • ${department?.name}`} />

      <div className="hero-panel">
        <div>
          <span className="eyebrow">Academic posture</span>
          <div className="hero-panel__badges">
            <StatusBadge tone={statusTone(student.status)} label={student.status} />
            <StatusBadge tone={statusTone(student.clearanceStatus)} label={student.clearanceStatus} />
          </div>
        </div>
        <div className="hero-panel__metrics">
          <div>
            <span>Faculty</span>
            <strong>{faculty?.name}</strong>
          </div>
          <div>
            <span>Adviser</span>
            <strong>{adviser?.name ?? 'Not assigned'}</strong>
          </div>
          <div>
            <span>Current GPA</span>
            <strong>{gpa.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div className="tab-row">
        {['profile', 'finance', 'registration', 'results'].map((item) => (
          <button key={item} type="button" className={tab === item ? 'tab-button is-active' : 'tab-button'} onClick={() => setTab(item as typeof tab)}>
            {item}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <SectionCard title="Identity and contacts" subtitle="Student-facing data that needs to stay stable across all university modules.">
          <div className="info-grid">
            <div><span>Email</span><strong>{student.email}</strong></div>
            <div><span>Phone</span><strong>{student.phone}</strong></div>
            <div><span>Sponsor</span><strong>{student.sponsorName}</strong></div>
            <div><span>Next of kin</span><strong>{student.nextOfKin}</strong></div>
          </div>
          <div className="list-stack">
            {student.documents.map((document) => (
              <div key={document.name} className="list-row">
                <strong>{document.name}</strong>
                <StatusBadge tone={statusTone(document.status)} label={document.status} />
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {tab === 'finance' ? (
        <SectionCard title="Financial posture" subtitle="This is the prototype view that ties fees, balances, and downstream academic holds together.">
          <div className="info-grid">
            <div><span>Total billed</span><strong>{formatCurrency(financialPosition.totalBilled)}</strong></div>
            <div><span>Total paid</span><strong>{formatCurrency(financialPosition.totalPaid)}</strong></div>
            <div><span>Outstanding</span><strong>{formatCurrency(financialPosition.outstanding)}</strong></div>
            <div><span>Invoices</span><strong>{invoices.length}</strong></div>
          </div>
          <div className="list-stack">
            {invoices.slice(0, 4).map((invoice) => (
              <div key={invoice.id} className="list-row">
                <div>
                  <strong>{invoice.invoiceNumber}</strong>
                  <p>{formatCurrency(invoice.totalAmount)}</p>
                </div>
                <StatusBadge tone={statusTone(invoice.status)} label={invoice.status} />
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {tab === 'registration' ? (
        <SectionCard title="Current registration" subtitle="Shows the exact point where finance policy, advising, and HOD approval converge.">
          {registration ? (
            <div className="info-grid">
              <div><span>Status</span><StatusBadge tone={statusTone(registration.status)} label={registration.status} /></div>
              <div><span>Total units</span><strong>{registration.totalUnits}</strong></div>
              <div><span>Adviser review</span><StatusBadge tone={statusTone(registration.adviserReview)} label={registration.adviserReview} /></div>
              <div><span>HOD review</span><StatusBadge tone={statusTone(registration.hodReview)} label={registration.hodReview} /></div>
            </div>
          ) : (
            <div className="empty-state">No active registration found for this student.</div>
          )}
        </SectionCard>
      ) : null}

      {tab === 'results' ? (
        <SectionCard title="Recent result sheet" subtitle="Condensed view of score rows, approval state, and carryover risk for this student.">
          <div className="list-stack">
            {results.slice(0, 6).map((entry) => (
              <div key={entry.id} className="list-row">
                <div>
                  <strong>{entry.course?.code}</strong>
                  <p>{entry.course?.title}</p>
                </div>
                <div className="row-meta">
                  <span>{entry.totalScore}</span>
                  {entry.carryover ? <StatusBadge tone="carryover" label="carryover" /> : null}
                  <StatusBadge tone={statusTone(entry.status)} label={entry.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
