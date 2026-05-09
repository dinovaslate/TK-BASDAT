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
  const [receipt, setReceipt] = useState(null);
  const recentTransfers = state.transfers.filter(
    (item) => item.fromMemberNumber === state.currentMember.memberNumber
  ).length;

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateTransfer(values, state.currentMember);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const transfer = transferMiles(values);
    setReceipt(transfer);
    setValues(defaultValues);
    notify({
      type: 'success',
      title: 'Transfer completed',
      message: `${transfer.amount.toLocaleString('en-US')} miles sent to ${transfer.toMemberNumber}.`,
    });
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
