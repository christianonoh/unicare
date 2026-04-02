import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDemoDataStore, useDemoRevision } from '../../app/store/demoDataStore';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { getInvoiceById } from '../../data/services/universityData';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { statusTone } from '../../lib/status';
import { toast } from '../../lib/toast';

export function InvoiceDetailPage() {
  useDemoRevision();
  const { invoiceId = '' } = useParams();
  const postPayment = useDemoDataStore((state) => state.postPayment);
  const detail = getInvoiceById(invoiceId);
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState<'Paystack' | 'Bank Transfer' | 'Remita' | 'POS'>('Paystack');

  if (!detail) {
    return <div className="empty-state">Invoice not found in this demo dataset.</div>;
  }

  const { invoice, feeTemplate, payments, ownerName } = detail;
  const balance = invoice.totalAmount - invoice.amountPaid;

  function handlePostPayment() {
    const result = postPayment({
      invoiceId: invoice.id,
      amount: Number(amount),
      channel,
    });

    result.ok ? toast.success(result.message) : toast.error(result.message);
    if (result.ok) {
      setAmount('');
    }
  }

  return (
    <div className="page-grid">
      <PageHeader eyebrow="Invoice detail" title={invoice.invoiceNumber} description={`${ownerName} • ${feeTemplate?.name ?? 'General billing'}`} />

      <SectionCard title="Billing posture" subtitle="The core finance summary a bursary or registry officer needs to take action.">
        <div className="info-grid">
          <div><span>Total amount</span><strong>{formatCurrency(invoice.totalAmount)}</strong></div>
          <div><span>Paid</span><strong>{formatCurrency(invoice.amountPaid)}</strong></div>
          <div><span>Balance</span><strong>{formatCurrency(balance)}</strong></div>
          <div><span>Status</span><StatusBadge tone={statusTone(invoice.status)} label={invoice.status} /></div>
        </div>
        {invoice.holdReason ? <p className="note-callout">{invoice.holdReason}</p> : null}
      </SectionCard>

      <SectionCard title="Post payment" subtitle="A live demo mutation that updates the invoice ledger, payment history, and downstream financial posture.">
        <div className="form-grid">
          <label className="field-group">
            <span>Amount</span>
            <input type="number" value={amount} placeholder={String(balance)} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Channel</span>
            <select value={channel} onChange={(event) => setChannel(event.target.value as typeof channel)}>
              <option value="Paystack">Paystack</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Remita">Remita</option>
              <option value="POS">POS</option>
            </select>
          </label>
          <div className="field-group field-group--actions">
            <span>Apply</span>
            <button type="button" className="primary-button" onClick={handlePostPayment} disabled={balance <= 0}>
              Post payment
            </button>
          </div>
        </div>
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
