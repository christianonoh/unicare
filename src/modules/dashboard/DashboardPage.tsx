import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getDashboardSummary, getReferenceData, getRegistrationBreakdown, getRevenueTrend, listApplicants, listInvoices } from '../../data/services/universityData';
import { formatCompact, formatCurrency } from '../../lib/formatters';
import { statusTone } from '../../lib/status';

export function DashboardPage() {
  const summary = getDashboardSummary();
  const revenueTrend = getRevenueTrend();
  const registrationBreakdown = getRegistrationBreakdown();
  const applicants = listApplicants().slice(0, 6);
  const atRiskInvoices = listInvoices().filter((invoice) => invoice.status === 'overdue' || invoice.status === 'unpaid').slice(0, 6);
  const missingLecturerCourses = getReferenceData().courses.filter((course) => !course.lecturerId).slice(0, 6);

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="University command center"
        title="Operational overview"
        description="An executive snapshot of registry workload, fee exposure, registration readiness, and unresolved academic operations for the active semester."
        actions={<button type="button" className="ghost-button">Board summary</button>}
      />

      <div className="stats-grid">
        <StatCard label="Students on record" value={formatCompact(summary.totalStudents)} meta="Across 12 programmes and four active levels." />
        <StatCard label="Active applicants" value={formatCompact(summary.activeApplicants)} meta="Current cycle applications still under review or progressing." />
        <StatCard label="Outstanding revenue" value={formatCurrency(summary.outstandingRevenue)} meta="Open invoices across returning students and freshers." />
        <StatCard label="Results awaiting action" value={formatCompact(summary.resultsAwaitingApproval)} meta="Rows still pending lecturer submission or department review." />
      </div>

      <div className="split-grid">
        <SectionCard title="Billing and collection trend" subtitle="Five-month picture for how invoicing converts to actual cash collection.">
          <div className="chart-shell">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde7e5" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}m`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Area dataKey="collected" type="monotone" stroke="#0f766e" fill="url(#collectedFill)" />
                <Area dataKey="invoiced" type="monotone" stroke="#b45309" fill="rgba(180, 83, 9, 0.08)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Registration pipeline" subtitle="Live split between approved, pending, held, and rejected registration packs.">
          <div className="chart-shell">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={registrationBreakdown} dataKey="value" nameKey="name" outerRadius={92} innerRadius={58} fill="#14532d" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="split-grid">
        <SectionCard title="Admissions queue" subtitle="Applicants who illustrate the range of states leadership will want to see in a demo.">
          <div className="list-stack">
            {applicants.map((applicant) => (
              <Link key={applicant.id} to={`/registry/applicants/${applicant.id}`} className="list-row">
                <div>
                  <strong>{applicant.fullName}</strong>
                  <p>{applicant.programmeName}</p>
                </div>
                <div className="row-meta">
                  <StatusBadge tone={statusTone(applicant.admissionStatus)} label={applicant.admissionStatus} />
                  <StatusBadge tone={statusTone(applicant.clearanceStatus)} label={applicant.clearanceStatus} />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Immediate financial risks" subtitle="Students or applicants currently blocked by fee exposure or unresolved holds.">
          <div className="list-stack">
            {atRiskInvoices.map((invoice) => (
              <Link key={invoice.id} to={`/finance/invoices/${invoice.id}`} className="list-row">
                <div>
                  <strong>{invoice.ownerName}</strong>
                  <p>{invoice.programmeName}</p>
                </div>
                <div className="row-meta">
                  <span>{formatCurrency(invoice.balance)}</span>
                  <StatusBadge tone={statusTone(invoice.status)} label={invoice.status} />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Data quality watchlist" subtitle="Important modelling gaps surfaced by the seed set to guide later backend and process design.">
        <div className="list-stack">
          {missingLecturerCourses.map((course) => (
            <div key={course.id} className="list-row">
              <div>
                <strong>{course.code}</strong>
                <p>{course.title}</p>
              </div>
              <StatusBadge tone="warning" label="lecturer missing" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
