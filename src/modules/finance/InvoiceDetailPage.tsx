import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getInvoiceById } from '../../data/services/universityData';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { statusTone } from '../../lib/status';

export function InvoiceDetailPage() {
  const { invoiceId = '' } = useParams();
  const detail = getInvoiceById(invoiceId);

  if (!detail) {
    return <div className="empty-state">Invoice not found in this demo dataset.</div>;
  }

  const { invoice, feeTemplate, payments, ownerName } = detail;

  return (
    <div className="page-grid">
      <PageHeader eyebrow="Invoice detail" title={invoice.invoiceNumber} description={`${ownerName} • ${feeTemplate?.name ?? 'General billing'}`} />

      <SectionCard title="Billing posture" subtitle="The core finance summary a bursary or registry officer needs to take action.">
        <div className="info-grid">
          <div><span>Total amount</span><strong>{formatCurrency(invoice.totalAmount)}</strong></div>
          <div><span>Paid</span><strong>{formatCurrency(invoice.amountPaid)}</strong></div>
          <div><span>Balance</span><strong>{formatCurrency(invoice.totalAmount - invoice.amountPaid)}</strong></div>
          <div><span>Status</span><StatusBadge tone={statusTone(invoice.status)} label={invoice.status} /></div>
        </div>
        {invoice.holdReason ? <p className="note-callout">{invoice.holdReason}</p> : null}
      </SectionCard>

      <SectionCard title="Payment history" subtitle="Supports the future relationship between invoice records, reconciliation, and audit trail.">
        <div className="list-stack">
          {payments.length ? (
            payments.map((payment) => (
              <div key={payment.id} className="list-row">
                <div>
                  <strong>{payment.channel}</strong>
                  <p>{formatDate(payment.paidAt)}</p>
                </div>
                <div className="row-meta">
                  <span>{formatCurrency(payment.amount)}</span>
                  <StatusBadge tone={statusTone(payment.status)} label={payment.status} />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No payments posted yet.</div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
