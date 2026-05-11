import { useState } from 'react';
import FormField from '../../components/FormField';
import { useAppContext } from '../../context/AppContext';
import { formatNumber } from '../../utils/formatters';
import { validateTransfer } from '../../utils/validation';

const defaultValues = {
  recipientMemberNumber: '',
  amount: '',
  note: '',
};

export default function TransferMilesPage() {
  const { state, transferMiles, notify } = useAppContext();
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [formMessage, setFormMessage] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const recentTransfers = state.transfers.filter(
    (item) => item.fromMemberNumber === state.currentMember.memberNumber
  ).length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateTransfer(values, state.currentMember);
    setErrors(nextErrors);
    setFormMessage(null);

    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      const transfer = await transferMiles(values);
      setReceipt(transfer);
      setValues(defaultValues);
      setFormMessage({ type: 'success', text: transfer.message });
      notify({
        type: 'success',
        title: 'Transfer completed',
        message: transfer.message,
      });
    } catch (error) {
      setFormMessage({ type: 'error', text: error.message });
      notify({
        type: 'error',
        title: 'Transfer blocked',
        message: error.message,
      });
    }
  };

  return (
    <div className="two-column-grid">
      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel-header">
          <div>
            <div className="eyebrow">Member to member</div>
            <h2>Transfer miles</h2>
          </div>
        </div>

        <div className="stack gap-md">
          <FormField
            label="Recipient member number"
            value={values.recipientMemberNumber}
            onChange={(event) => setValues((current) => ({ ...current, recipientMemberNumber: event.target.value }))}
            error={errors.recipientMemberNumber}
            data-testid="transfer-recipient-input"
          />
          <FormField
            label="Amount"
            type="number"
            value={values.amount}
            onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))}
            error={errors.amount}
            data-testid="transfer-amount-input"
          />
          <FormField
            label="Note"
            multiline
            rows={4}
            value={values.note}
            onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))}
          />
          {formMessage ? (
            <div className={formMessage.type === 'error' ? 'error-banner' : 'success-banner'}>{formMessage.text}</div>
          ) : null}
          <button type="submit" className="button button-primary" data-testid="transfer-confirm">
            Confirm Transfer
          </button>
        </div>
      </form>

      <section className="panel wallet-panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Wallet</div>
            <h2>Available balance</h2>
          </div>
        </div>
        <div className="wallet-balance-card">
          <span className="eyebrow">Current award miles</span>
          <div className="balance-figure">{formatNumber(state.currentMember.awardMiles)} miles</div>
          <div className="wallet-meta-list">
            <div className="wallet-meta-row">
              <span>Member number</span>
              <strong>{state.currentMember.memberNumber}</strong>
            </div>
            <div className="wallet-meta-row">
              <span>Current tier</span>
              <strong>{state.currentMember.tier}</strong>
            </div>
            <div className="wallet-meta-row">
              <span>Completed transfers</span>
              <strong>{recentTransfers}</strong>
            </div>
          </div>
        </div>
        <div className="wallet-note-list">
          <div className="wallet-note">Transfers must be above zero and cannot exceed the current wallet balance.</div>
          <div className="wallet-note">Recipient member number cannot match your own AeroMiles member number.</div>
        </div>
        {receipt ? (
          <div className="receipt-card" data-testid="transfer-success">
            <strong>{receipt.id}</strong>
            <span>Recipient: {receipt.toMemberNumber}</span>
            <span>Remaining balance: {formatNumber(state.currentMember.awardMiles)} miles</span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
