import { createColumnHelper } from '@tanstack/react-table';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { AcademicScopePanel } from '../../components/AcademicScopePanel';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getAcademicScopeOptions, getReferenceData, listApplicants, listInvoices, listPayments, listStudents, matchesAcademicScope } from '../../data/services/universityData';
import { formatCurrency } from '../../lib/formatters';
import { statusTone } from '../../lib/status';
import { toast } from '../../lib/toast';

type FinanceView = 'templates' | 'invoices' | 'payments' | 'holds';

interface FinancePageProps {
  view?: FinanceView;
}

interface InvoiceDraft {
  ownerType: 'student' | 'applicant';
  ownerId: string;
  feeTemplateId: string;
  dueDate: string;
}

export function FinancePage({ view = 'templates' }: FinancePageProps) {
  useDemoRevision();
  const navigate = useNavigate();
  const createInvoice = useDemoDataStore((state) => state.createInvoice);
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [statusFilter, setStatusFilter] = useState(view === 'holds' ? 'active-holds' : 'all');
  const [query, setQuery] = useState('');
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [formError, setFormError] = useState('');
  const { feeTemplates } = getReferenceData();
  const applicantOptions = listApplicants().filter((applicant) => applicant.admissionStatus === 'offered' || applicant.admissionStatus === 'accepted');
  const studentOptions = listStudents();
  const allInvoices = listInvoices();
  const allPayments = listPayments();
  const { faculties, departments, programmes: scopedProgrammes, levels } = getAcademicScopeOptions({ facultyId, departmentId });
  const isScopedView = view !== 'templates';
  const hasRequiredScope = !isScopedView || Boolean(facultyId && departmentId);
  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft>({
    ownerType: 'student',
    ownerId: studentOptions[0]?.id ?? '',
    feeTemplateId: feeTemplates[0]?.id ?? '',
    dueDate: '2026-04-30',
  });

  const pageContent: Record<
    FinanceView,
    { eyebrow: string; title: string; description: string; sectionTitle?: string; sectionEmptyMessage?: string; resultLabel?: string }
  > = {
    templates: {
      eyebrow: 'Bursary operations',
      title: 'Fee templates',
      description: 'Template-driven billing is where future fee policy, programme setup, and student charging rules begin.',
    },
    invoices: {
      eyebrow: 'Bursary operations',
      title: 'Invoices',
      description: 'Track billed amounts, balances, and invoice-level status inside a scoped bursary ledger built for scale.',
      sectionTitle: 'Invoice ledger',
      sectionEmptyMessage: 'Choose a faculty and department to load invoices.',
      resultLabel: 'invoices in scope',
    },
    payments: {
      eyebrow: 'Bursary operations',
      title: 'Payments',
      description: 'View transaction history across channels only after choosing the academic ownership context that produced it.',
      sectionTitle: 'Payment register',
      sectionEmptyMessage: 'Choose a faculty and department to load payments.',
      resultLabel: 'payments in scope',
    },
    holds: {
      eyebrow: 'Bursary operations',
      title: 'Registration holds',
      description: 'Focus on unpaid and overdue accounts that can block registration or trigger registrar intervention.',
      sectionTitle: 'Held accounts',
      sectionEmptyMessage: 'Choose a faculty and department to load held accounts.',
      resultLabel: 'hold cases in scope',
    },
  };

  const scopedInvoices = allInvoices.filter((invoice) => {
    const matchesView = view === 'holds' ? invoice.status === 'unpaid' || invoice.status === 'overdue' : view === 'invoices';
    return matchesView && matchesAcademicScope(invoice, { facultyId, departmentId, programmeId, levelId });
  });
  const invoices = scopedInvoices.filter((invoice) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      invoice.invoiceNumber.toLowerCase().includes(normalizedQuery) ||
      invoice.ownerName.toLowerCase().includes(normalizedQuery) ||
      invoice.programmeName.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      view === 'holds'
        ? statusFilter === 'active-holds'
          ? invoice.status === 'unpaid' || invoice.status === 'overdue'
          : invoice.status === statusFilter
        : statusFilter === 'all'
          ? true
          : invoice.status === statusFilter;

    return matchesQuery && matchesStatus;
  });
  const scopedPayments = allPayments.filter((payment) => matchesAcademicScope(payment, { facultyId, departmentId, programmeId, levelId }));
  const payments = scopedPayments.filter((payment) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      payment.invoiceNumber.toLowerCase().includes(normalizedQuery) ||
      payment.ownerName.toLowerCase().includes(normalizedQuery) ||
      payment.programmeName.toLowerCase().includes(normalizedQuery);
    const matchesStatus = statusFilter === 'all' ? true : payment.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const invoiceColumns = [
    createColumnHelper<(typeof invoices)[number]>().accessor('invoiceNumber', {
      header: 'Invoice',
      cell: (info) => <Link to={`/finance/invoices/${info.row.original.id}`}>{info.getValue()}</Link>,
    }),
    createColumnHelper<(typeof invoices)[number]>().accessor('ownerName', { header: 'Owner', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof invoices)[number]>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof invoices)[number]>().accessor('levelName', { header: 'Level', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof invoices)[number]>().accessor('balance', { header: 'Balance', cell: (info) => formatCurrency(info.getValue()) }),
    createColumnHelper<(typeof invoices)[number]>().accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];
  const paymentColumns = [
    createColumnHelper<(typeof payments)[number]>().accessor('invoiceNumber', { header: 'Invoice', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof payments)[number]>().accessor('ownerName', { header: 'Owner', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof payments)[number]>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof payments)[number]>().accessor('levelName', { header: 'Level', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof payments)[number]>().accessor('amount', { header: 'Amount', cell: (info) => formatCurrency(info.getValue()) }),
    createColumnHelper<(typeof payments)[number]>().accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  const ownerOptions = invoiceDraft.ownerType === 'student' ? studentOptions : applicantOptions;

  function openCreateInvoice(templateId?: string) {
    setInvoiceDraft((current) => ({
      ...current,
      feeTemplateId: templateId ?? current.feeTemplateId,
      ownerType: 'student',
      ownerId: studentOptions[0]?.id ?? '',
    }));
    setFormError('');
    setShowCreateInvoiceModal(true);
  }

  function handleCreateInvoice() {
    const result = createInvoice(invoiceDraft);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setShowCreateInvoiceModal(false);
    setFormError('');
    toast.success('Invoice created successfully.');
    if (result.id) {
      navigate(`/finance/invoices/${result.id}`);
    }
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
          <button type="button" className="primary-button" onClick={() => openCreateInvoice()}>
            Generate invoice
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Fee templates" value={String(feeTemplates.length)} meta="Policy-backed billing templates that can later drive programme or level billing." />
        <StatCard label="Paid invoices" value={String(allInvoices.filter((item) => item.status === 'paid').length)} meta="Accounts already clear for academic progression." />
        <StatCard label="Open exposure" value={String(allInvoices.filter((item) => item.status !== 'paid').length)} meta="Invoices with balances that still affect registration." />
        <StatCard label="Held cases" value={String(allInvoices.filter((item) => item.status === 'overdue' || item.status === 'unpaid').length)} meta="Records most likely to trigger admin intervention." />
      </div>

      {isScopedView ? (
        <AcademicScopePanel
          title="Academic scope"
          description="Choose ownership first so finance ledgers open inside a faculty and department context instead of loading every record at once."
          facultyId={facultyId}
          departmentId={departmentId}
          programmeId={programmeId}
          levelId={levelId}
          faculties={faculties.map((faculty) => ({ id: faculty.id, label: faculty.name }))}
          departments={departments.map((department) => ({ id: department.id, label: department.name }))}
          programmes={scopedProgrammes.map((programme) => ({ id: programme.id, label: `${programme.award} ${programme.name}` }))}
          levels={levels.map((level) => ({ id: level.id, label: level.name }))}
          resultLabel={pageContent[view].resultLabel ?? 'records in scope'}
          resultCount={hasRequiredScope ? (view === 'payments' ? scopedPayments.length : scopedInvoices.length) : 0}
          resultMeta="Page-level scope narrows the ledger before search and status refine the records below."
          emptyMessage={pageContent[view].sectionEmptyMessage ?? 'Choose a faculty and department to load records.'}
          onFacultyChange={handleFacultyChange}
          onDepartmentChange={handleDepartmentChange}
          onProgrammeChange={handleProgrammeChange}
          onLevelChange={setLevelId}
        />
      ) : null}

      {view === 'templates' ? (
        <div className="triple-grid">
          {feeTemplates.map((template) => (
            <SectionCard
              key={template.id}
              title={template.name}
              subtitle={`${template.items.length} fee lines`}
              aside={
                <button type="button" className="ghost-button" onClick={() => openCreateInvoice(template.id)}>
                  Use template
                </button>
              }
            >
              <div className="list-stack">
                {template.items.map((item) => (
                  <div key={item.id} className="list-row">
                    <strong>{item.label}</strong>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      ) : null}

      {view === 'invoices' || view === 'holds' ? (
        <SectionCard
          title={pageContent[view].sectionTitle ?? 'Invoice ledger'}
          subtitle="Search and status only refine the scoped bursary records."
          aside={
            <div className="table-toolbar">
              <input
                className="search-input"
                placeholder="Search invoice, owner, or programme"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={!hasRequiredScope}
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={!hasRequiredScope}>
                {view === 'holds' ? (
                  <>
                    <option value="active-holds">All hold cases</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="overdue">Overdue</option>
                  </>
                ) : (
                  <>
                    <option value="all">All invoices</option>
                    <option value="paid">Paid</option>
                    <option value="part_paid">Part paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="overdue">Overdue</option>
                    <option value="waived">Waived</option>
                  </>
                )}
              </select>
            </div>
          }
        >
          {hasRequiredScope ? <DataTable data={invoices} columns={invoiceColumns} exportFilename="invoices" /> : <div className="empty-state">{pageContent[view].sectionEmptyMessage}</div>}
        </SectionCard>
      ) : null}

      {view === 'payments' ? (
        <SectionCard
          title={pageContent[view].sectionTitle ?? 'Payment register'}
          subtitle="Search and status only refine the scoped payment history."
          aside={
            <div className="table-toolbar">
              <input
                className="search-input"
                placeholder="Search invoice, owner, or programme"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={!hasRequiredScope}
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={!hasRequiredScope}>
                <option value="all">All payments</option>
                <option value="successful">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="reconciled">Reconciled</option>
              </select>
            </div>
          }
        >
          {hasRequiredScope ? <DataTable data={payments} columns={paymentColumns} exportFilename="payments" /> : <div className="empty-state">{pageContent[view].sectionEmptyMessage}</div>}
        </SectionCard>
      ) : null}

      {showCreateInvoiceModal ? (
        <Modal
          title="Generate invoice"
          description="This simulates bursary invoice creation against a student or applicant record."
          onClose={() => setShowCreateInvoiceModal(false)}
          footer={
            <>
              <button type="button" className="ghost-button" onClick={() => setShowCreateInvoiceModal(false)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleCreateInvoice}>
                Create invoice
              </button>
            </>
          }
        >
          <div className="form-grid">
            <label className="field-group">
              <span>Owner type</span>
              <select
                value={invoiceDraft.ownerType}
                onChange={(event) =>
                  setInvoiceDraft((current) => ({
                    ...current,
                    ownerType: event.target.value as 'student' | 'applicant',
                    ownerId: event.target.value === 'student' ? studentOptions[0]?.id ?? '' : applicantOptions[0]?.id ?? '',
                  }))
                }
              >
                <option value="student">Student</option>
                <option value="applicant">Applicant</option>
              </select>
            </label>
            <label className="field-group">
              <span>Owner</span>
              <select value={invoiceDraft.ownerId} onChange={(event) => setInvoiceDraft((current) => ({ ...current, ownerId: event.target.value }))}>
                {ownerOptions.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {'matricNumber' in owner ? `${owner.fullName} (${owner.matricNumber})` : `${owner.fullName} (${owner.applicationNumber})`}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Fee template</span>
              <select value={invoiceDraft.feeTemplateId} onChange={(event) => setInvoiceDraft((current) => ({ ...current, feeTemplateId: event.target.value }))}>
                {feeTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>Due date</span>
              <input type="date" value={invoiceDraft.dueDate} onChange={(event) => setInvoiceDraft((current) => ({ ...current, dueDate: event.target.value }))} />
            </label>
          </div>
          {formError ? <div className="note-callout note-callout--danger">{formError}</div> : null}
        </Modal>
      ) : null}
    </div>
  );
}
