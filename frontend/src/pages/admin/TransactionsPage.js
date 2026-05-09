import { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import { useAppContext } from '../../context/AppContext';
import { formatCurrencyIdr, formatNumber } from '../../utils/formatters';

const tabs = ['Miles Purchase', 'Miles Transfer', 'Reward Redemption', 'Claim Miles'];

export default function TransactionsPage() {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState('Miles Purchase');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const dataset = useMemo(() => {
    const items = {
      'Miles Purchase': state.purchases.map((purchase) => ({
        id: purchase.id,
        primary: purchase.memberNumber,
        secondary: purchase.packageLabel,
        value: `${formatNumber(purchase.amount)} miles`,
        amount: formatCurrencyIdr(purchase.price),
        status: purchase.status,
        createdAt: purchase.createdAt,
      })),
      'Miles Transfer': state.transfers.map((transfer) => ({
        id: transfer.id,
        primary: `${transfer.fromMemberNumber} to ${transfer.toMemberNumber}`,
        secondary: transfer.note || 'Transfer',
        value: `${formatNumber(transfer.amount)} miles`,
        amount: '-',
        status: transfer.status,
        createdAt: transfer.createdAt,
      })),
      'Reward Redemption': state.redemptions.map((redemption) => ({
        id: redemption.id,
        primary: redemption.memberNumber,
        secondary: redemption.rewardTitle,
        value: `${formatNumber(redemption.milesCost)} miles`,
        amount: '-',
        status: redemption.status,
        createdAt: redemption.createdAt,
      })),
      'Claim Miles': state.claims.map((claim) => ({
        id: claim.id,
        primary: claim.memberNumber,
        secondary: `${claim.airline} ${claim.flightNumber}`,
        value: `${formatNumber(claim.requestedMiles)} miles`,
        amount: '-',
        status: claim.status,
        createdAt: claim.submittedAt,
      })),
    };

    return items[activeTab];
  }, [activeTab, state.claims, state.purchases, state.redemptions, state.transfers]);

  const filteredRows = dataset.filter((item) =>
    Object.values(item).join(' ').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'id', label: 'Transaction ID' },
    { key: 'primary', label: 'Reference' },
    { key: 'secondary', label: 'Details' },
    { key: 'value', label: 'Value' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={row.status === 'Rejected' ? 'danger' : row.status === 'Pending Review' ? 'gold' : 'success'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <button
          type="button"
          className="button button-secondary compact-button"
          onClick={() => setSelectedItem(row)}
          data-testid={`view-transaction-${row.id}`}
        >
          View
        </button>
      ),
    },
  ];

  const tabIds = {
    'Miles Purchase': 'transaction-tab-purchase',
    'Miles Transfer': 'transaction-tab-transfer',
    'Reward Redemption': 'transaction-tab-redemption',
    'Claim Miles': 'transaction-tab-claim',
  };

  const detailFields = selectedItem
    ? [
        { label: 'Transaction ID', value: selectedItem.id },
        {
          label:
            activeTab === 'Miles Transfer'
              ? 'Transfer reference'
              : activeTab === 'Reward Redemption'
                ? 'Member number'
                : activeTab === 'Claim Miles'
                  ? 'Member number'
                  : 'Member number',
          value: selectedItem.primary,
        },
        {
          label:
            activeTab === 'Miles Purchase'
              ? 'Package'
              : activeTab === 'Miles Transfer'
                ? 'Transfer note'
                : activeTab === 'Reward Redemption'
                  ? 'Reward'
                  : 'Flight reference',
          value: selectedItem.secondary,
          wide: true,
        },
        { label: 'Recorded on', value: selectedItem.createdAt, wide: true },
      ]
    : [];

  const summaryMetrics = selectedItem
    ? [
        { label: 'Status', value: selectedItem.status, badge: true },
        { label: 'Miles', value: selectedItem.value },
        ...(selectedItem.amount !== '-' ? [{ label: activeTab === 'Miles Purchase' ? 'Revenue' : 'Amount', value: selectedItem.amount }] : []),
      ]
    : [];

  return (
    <div className="stack gap-xl" data-testid="admin-transactions-page">
      <section className="panel">
        <div className="panel-header panel-header-wrap">
          <div>
            <div className="eyebrow">Transaction records</div>
            <h2>Operational ledger</h2>
          </div>
          <input
            className="field-input search-input"
            placeholder="Search transactions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            data-testid="transaction-search-input"
          />
        </div>

        <div className="segmented-control transaction-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`segment ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              data-testid={tabIds[tab]}
            >
              {tab}
            </button>
          ))}
        </div>

        <DataTable columns={columns} rows={filteredRows} testId="transactions-table" />
      </section>

      <Drawer
        open={Boolean(selectedItem)}
        title={selectedItem?.id || ''}
        onClose={() => setSelectedItem(null)}
        testId="transaction-detail-drawer"
        placement="center"
      >
        {selectedItem ? (
          <div className="transaction-detail stack gap-lg">
            <section className="transaction-summary-strip">
              <div className="stack gap-xs">
                <div className="eyebrow">{activeTab}</div>
                <h4>{selectedItem.secondary}</h4>
                <p>{selectedItem.primary}</p>
              </div>
              <div className="transaction-summary-metrics">
                {summaryMetrics.map((metric) => (
                  <div key={metric.label} className="transaction-metric">
                    <span className="detail-label">{metric.label}</span>
                    {metric.badge ? (
                      <Badge tone={selectedItem.status === 'Rejected' ? 'danger' : selectedItem.status === 'Pending Review' ? 'gold' : 'success'}>
                        {metric.value}
                      </Badge>
                    ) : (
                      <strong>{metric.value}</strong>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="transaction-detail-grid">
              {detailFields.map((field) => (
                <div
                  key={field.label}
                  className={`transaction-detail-card ${field.wide ? 'transaction-detail-card-wide' : ''}`.trim()}
                >
                  <span className="detail-label">{field.label}</span>
                  <strong>{field.value}</strong>
                </div>
              ))}
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
