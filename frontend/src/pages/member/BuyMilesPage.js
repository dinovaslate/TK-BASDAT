import { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrencyIdr, formatNumber } from '../../utils/formatters';

export default function BuyMilesPage() {
  const { state, purchaseMiles, notify } = useAppContext();
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const selectedPackage = useMemo(
    () => state.masterData.milesPackages.find((pkg) => pkg.id === selectedPackageId),
    [selectedPackageId, state.masterData.milesPackages]
  );

  const handleConfirm = () => {
    if (!selectedPackage) {
      setError('Please select a miles package before confirming.');
      return;
    }

    const purchase = purchaseMiles(selectedPackage);
    setReceipt(purchase);
    setError('');
    notify({
      type: 'success',
      title: 'Miles purchased',
      message: `${selectedPackage.label} has been added to the wallet.`,
    });
  };

  return (
    <div className="two-column-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Available packages</div>
            <h2>Choose Award Miles</h2>
          </div>
        </div>
        <div className="package-grid">
          {state.masterData.milesPackages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              className={`package-card ${selectedPackageId === pkg.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedPackageId(pkg.id);
                setError('');
              }}
              data-testid={`buy-package-${pkg.amount}`}
            >
              <strong>{pkg.label}</strong>
              <span>{formatCurrencyIdr(pkg.price)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Checkout</div>
            <h2>Purchase summary</h2>
          </div>
        </div>
        <div className="checkout-stack">
          <div className="summary-row">
            <span>Current Award Miles</span>
            <strong>{formatNumber(state.currentMember.awardMiles)}</strong>
          </div>
          <div className="summary-row">
            <span>Selected package</span>
            <strong>{selectedPackage ? selectedPackage.label : 'Not selected'}</strong>
          </div>
          <div className="summary-row">
            <span>Charge amount</span>
            <strong>{selectedPackage ? formatCurrencyIdr(selectedPackage.price) : '-'}</strong>
          </div>
          {error ? <div className="error-banner">{error}</div> : null}
          <button type="button" className="button button-primary" onClick={handleConfirm} data-testid="buy-confirm">
            Confirm Purchase
          </button>
        </div>

        {receipt ? (
          <div className="receipt-card" data-testid="purchase-success">
            <strong>{receipt.id}</strong>
            <span>{receipt.packageLabel}</span>
            <span>New balance: {formatNumber(state.currentMember.awardMiles)} miles</span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
