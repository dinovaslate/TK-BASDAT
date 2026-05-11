import { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { useAppContext } from '../../context/AppContext';
import { formatNumber } from '../../utils/formatters';

export default function RewardsPage() {
  const { state, notify, redeemReward } = useAppContext();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedReward, setSelectedReward] = useState(null);
  const [error, setError] = useState('');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(state.rewards.map((reward) => reward.category)))],
    [state.rewards]
  );

  const rewards = useMemo(() => {
    return state.rewards.filter((reward) => {
      const matchesCategory = category === 'All' || reward.category === category;
      const query = search.toLowerCase();
      const matchesQuery =
        reward.title.toLowerCase().includes(query) ||
        reward.partner.toLowerCase().includes(query) ||
        reward.description.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [category, search, state.rewards]);

  const handleRedeem = (reward) => {
    if (reward.milesCost > state.currentMember.awardMiles) {
      setError('Insufficient Award Miles for this redemption.');
      notify({
        type: 'error',
        title: 'Redemption blocked',
        message: 'Insufficient Award Miles for this reward.',
      });
      return;
    }

    const receipt = redeemReward(reward);
    setSelectedReward(null);
    setError('');
    notify({
      type: 'success',
      title: 'Reward redeemed',
      message: `${reward.title} issued under ${receipt.id}.`,
    });
  };

  return (
    <div className="stack gap-xl">
      <section className="panel">
        <div className="catalog-header">
          <div>
            <div className="eyebrow">Redeem rewards</div>
            <h2>Partner catalog</h2>
          </div>
          <div className="catalog-toolbar">
            <input
              className="field-input search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rewards or partners"
            />
            <select className="field-input compact-input" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        {rewards.length ? (
          <div className="reward-grid">
            {rewards.map((reward) => (
              <article key={reward.id} className="reward-card" data-testid={`reward-card-${reward.id}`}>
                <div className="reward-topline">
                  <Badge tone={reward.status === 'Active' ? 'success' : 'warning'}>{reward.status}</Badge>
                  <span className="reward-partner">{reward.partner}</span>
                </div>
                <div className="reward-card-body">
                  <h3>{reward.title}</h3>
                  <p>{reward.description}</p>
                </div>
                <div className="reward-footer">
                  <div className="reward-miles">
                    <strong>{formatNumber(reward.milesCost)}</strong>
                    <span>miles</span>
                  </div>
                  <div className="button-row reward-actions">
                    <button type="button" className="button button-secondary compact-button" onClick={() => setSelectedReward(reward)}>
                      Detail
                    </button>
                    <button
                      type="button"
                      className="button button-accent compact-button"
                      onClick={() => handleRedeem(reward)}
                      data-testid={`reward-redeem-${reward.id}`}
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No rewards found" description="Try a broader keyword or another category." />
        )}
      </section>

      <Modal open={Boolean(selectedReward)} title={selectedReward?.title || ''} onClose={() => setSelectedReward(null)}>
        {selectedReward ? (
          <div className="stack gap-md">
            <div className="detail-grid">
              <div>
                <span className="detail-label">Category</span>
                <strong>{selectedReward.category}</strong>
              </div>
              <div>
                <span className="detail-label">Partner</span>
                <strong>{selectedReward.partner}</strong>
              </div>
              <div>
                <span className="detail-label">Miles required</span>
                <strong>{formatNumber(selectedReward.milesCost)}</strong>
              </div>
              <div>
                <span className="detail-label">Active until</span>
                <strong>{selectedReward.activeTo}</strong>
              </div>
            </div>
            <p className="muted-text">{selectedReward.description}</p>
            <div className="dialog-actions">
              <button type="button" className="button button-secondary" onClick={() => setSelectedReward(null)}>
                Close
              </button>
              <button type="button" className="button button-accent" onClick={() => handleRedeem(selectedReward)}>
                Confirm Redeem
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
