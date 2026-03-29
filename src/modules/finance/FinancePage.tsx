import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getReferenceData, listInvoices, listPayments } from '../../data/services/universityData';
import { formatCurrency } from '../../lib/formatters';
import { statusTone } from '../../lib/status';

type FinanceView = 'templates' | 'invoices' | 'payments' | 'holds';

interface FinancePageProps {
  view?: FinanceView;
}

export function FinancePage({ view = 'templates' }: FinancePageProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const { feeTemplates } = getReferenceData();
  const allInvoices = listInvoices();
  const allPayments = listPayments();
  const invoices = allInvoices.filter((invoice) => {
    const matchesView = view === 'holds' ? invoice.status === 'unpaid' || invoice.status === 'overdue' : view === 'invoices' ? true : false;
    const matchesStatus = statusFilter === 'all' ? true : invoice.status === statusFilter;
    return matchesView && matchesStatus;
  });
  const payments = allPayments.filter((payment) => (statusFilter === 'all' ? true : payment.status === statusFilter));
  const pageContent: Record<FinanceView, { eyebrow: string; title: string; description: string }> = {
    templates: {
      eyebrow: 'Bursary operations',
      title: 'Fee templates',
      description: 'Template-driven billing is where future fee policy, programme setup, and student charging rules begin.',
    },
    invoices: {
      eyebrow: 'Bursary operations',
      title: 'Invoices',
      description: 'Track billed amounts, balances, and invoice-level status for applicants and returning students.',
    },
    payments: {
      eyebrow: 'Bursary operations',
      title: 'Payments',
      description: 'View transaction history across channels and see how posted payments reconcile against invoice records.',
    },
    holds: {
      eyebrow: 'Bursary operations',
      title: 'Registration holds',
      description: 'Focus on unpaid and overdue accounts that can block registration or trigger registrar intervention.',
    },
  };

  const columns = [
    createColumnHelper<(typeof invoices)[number]>().accessor('invoiceNumber', {
      header: 'Invoice',
      cell: (info) => <Link to={`/finance/invoices/${info.row.original.id}`}>{info.getValue()}</Link>,
    }),
    createColumnHelper<(typeof invoices)[number]>().accessor('ownerName', { header: 'Owner', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof invoices)[number]>().accessor('programmeName', { header: 'Programme', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof invoices)[number]>().accessor('totalAmount', { header: 'Total', cell: (info) => formatCurrency(info.getValue()) }),
    createColumnHelper<(typeof invoices)[number]>().accessor('balance', { header: 'Balance', cell: (info) => formatCurrency(info.getValue()) }),
    createColumnHelper<(typeof invoices)[number]>().accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];
  const paymentColumns = [
    createColumnHelper<(typeof payments)[number]>().accessor('invoiceNumber', { header: 'Invoice', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof payments)[number]>().accessor('ownerName', { header: 'Owner', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof payments)[number]>().accessor('amount', { header: 'Amount', cell: (info) => formatCurrency(info.getValue()) }),
    createColumnHelper<(typeof payments)[number]>().accessor('channel', { header: 'Channel', cell: (info) => info.getValue() }),
    createColumnHelper<(typeof payments)[number]>().accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge tone={statusTone(info.getValue())} label={info.getValue()} />,
    }),
  ];

  return (
    <div className="page-grid">
      <PageHeader eyebrow={pageContent[view].eyebrow} title={pageContent[view].title} description={pageContent[view].description} />

      <div className="stats-grid">
        <StatCard label="Fee templates" value={String(feeTemplates.length)} meta="Policy-backed billing templates that can later drive programme or level billing." />
        <StatCard label="Paid invoices" value={String(listInvoices().filter((item) => item.status === 'paid').length)} meta="Accounts already clear for academic progression." />
        <StatCard label="Open exposure" value={String(listInvoices().filter((item) => item.status !== 'paid').length)} meta="Invoices with balances that still affect registration." />
        <StatCard label="Held cases" value={String(listInvoices().filter((item) => item.status === 'overdue' || item.status === 'unpaid').length)} meta="Records most likely to trigger admin intervention." />
      </div>

      {view === 'templates' ? (
        <div className="triple-grid">
          {feeTemplates.map((template) => (
            <SectionCard key={template.id} title={template.name} subtitle={`${template.items.length} fee lines`}>
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
          title={view === 'holds' ? 'Accounts currently holding registration' : 'Invoice ledger'}
          subtitle={
            view === 'holds'
              ? 'Only invoices that can actively block progression or registration.'
              : 'Designed to show where owner, fee template, payment records, and hold state connect.'
          }
          aside={
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All invoices</option>
              <option value="paid">Paid</option>
              <option value="part_paid">Part paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
          }
        >
          <DataTable data={invoices} columns={columns} />
        </SectionCard>
      ) : null}

      {view === 'payments' ? (
        <SectionCard
          title="Payment register"
          subtitle="A flatter system-of-record view of how actual transactions tie back to invoice entities."
          aside={
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All payments</option>
              <option value="successful">Successful</option>
              <option value="reconciled">Reconciled</option>
            </select>
          }
        >
          <DataTable data={payments} columns={paymentColumns} />
        </SectionCard>
      ) : null}
    </div>
  );
}
