import { useDemoRevision } from '../../app/store/demoDataStore';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { getDepartmentResultSummary, listApplicants, listInvoices, listRegistrations, listStudents } from '../../data/services/universityData';
import { formatCurrency } from '../../lib/formatters';

type ReportsView = 'admissions' | 'registration' | 'finance' | 'results';

interface ReportsPageProps {
  view?: ReportsView;
}

export function ReportsPage({ view = 'admissions' }: ReportsPageProps) {
  useDemoRevision();
  const applicants = listApplicants();
  const students = listStudents();
  const invoices = listInvoices();
  const registrations = listRegistrations();
  const departmentSummary = getDepartmentResultSummary();
  const content: Record<ReportsView, { title: string; description: string }> = {
    admissions: {
      title: 'Admissions reports',
      description: 'Leadership reporting for offer yield, conversion readiness, and faculty-by-faculty admission posture.',
    },
    registration: {
      title: 'Registration reports',
      description: 'Operational reporting around approved packs, held cases, and semester participation.',
    },
    finance: {
      title: 'Finance reports',
      description: 'A management view of balances, invoice coverage, and the bursary pressures affecting student progression.',
    },
    results: {
      title: 'Result reports',
      description: 'Department-level publication readiness and carryover exposure across the academic structure.',
    },
  };

  return (
    <div className="page-grid">
      <PageHeader eyebrow="Leadership reporting" title={content[view].title} description={content[view].description} />

      <div className="stats-grid">
        <StatCard label="Applicants admitted" value={String(applicants.filter((item) => item.admissionStatus === 'accepted').length)} meta="Feeds student conversion projections." />
        <StatCard label="Students registered" value={String(registrations.filter((item) => item.status === 'approved').length)} meta="Semester participation across all faculties." />
        <StatCard label="Invoices outstanding" value={String(invoices.filter((item) => item.balance > 0).length)} meta="Useful for bursary and senate briefings." />
        <StatCard label="Average revenue gap" value={formatCurrency(invoices.reduce((sum, item) => sum + item.balance, 0) / invoices.length)} meta="Simple management signal for cash exposure." />
      </div>

      {view === 'admissions' ? (
        <SectionCard title="Admissions by faculty" subtitle="A simple but powerful leadership report for yield discussions.">
          <div className="list-stack">
            {['faculty-science', 'faculty-arts', 'faculty-management'].map((facultyId) => (
              <div key={facultyId} className="list-row">
                <strong>{facultyId.replace('faculty-', '').replace('-', ' ')}</strong>
                <span>{applicants.filter((item) => item.facultyId === facultyId && item.admissionStatus === 'accepted').length} admitted</span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {view === 'registration' ? (
        <SectionCard title="Registration status by programme" subtitle="A compact report of registration posture by student and academic path.">
          <div className="list-stack">
            {registrations.slice(0, 10).map((registration) => (
              <div key={registration.id} className="list-row">
                <div>
                  <strong>{registration.studentName}</strong>
                  <p>{registration.programmeName}</p>
                </div>
                <div className="row-meta">
                  <span>{registration.totalUnits} units</span>
                  <span>{registration.status}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {view === 'finance' ? (
        <SectionCard title="Outstanding balances by programme" subtitle="What the future system should make sortable and exportable.">
          <div className="list-stack">
            {students.slice(0, 10).map((student) => {
              const studentInvoices = invoices.filter((item) => item.ownerName === student.fullName);
              const outstanding = studentInvoices.reduce((sum, invoice) => sum + invoice.balance, 0);

              return (
                <div key={student.id} className="list-row">
                  <div>
                    <strong>{student.fullName}</strong>
                    <p>{student.programmeName}</p>
                  </div>
                  <span>{formatCurrency(outstanding)}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      {view === 'results' ? (
        <SectionCard title="Department result summary" subtitle="A direct pointer to the institutional structures that matter in a university result workflow.">
          <div className="list-stack">
            {departmentSummary.map((summary) => (
              <div key={summary.departmentId} className="list-row">
                <div>
                  <strong>{summary.departmentName}</strong>
                  <p>{summary.students} students</p>
                </div>
                <div className="row-meta">
                  <span>{summary.awaiting} awaiting</span>
                  <span>{summary.carryovers} carryovers</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
