import { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import Modal from '../../components/Modal';
import SelectField from '../../components/SelectField';
import { useAppContext } from '../../context/AppContext';
import { formatNumber, isWithinWarningWindow } from '../../utils/formatters';
import { validatePartner, validateReward } from '../../utils/validation';

const defaultPartner = { id: '', name: '', type: '', status: '' };
const defaultReward = { id: '', title: '', category: '', partner: '', milesCost: '', status: '', activeFrom: '', activeTo: '', description: '' };

const toTestSegment = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function RewardsManagementPage() {
  const { state, savePartners, saveRewards, notify } = useAppContext();
  const [partnerValues, setPartnerValues] = useState(defaultPartner);
  const [rewardValues, setRewardValues] = useState(defaultReward);
  const [partnerErrors, setPartnerErrors] = useState({});
  const [rewardErrors, setRewardErrors] = useState({});
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const partnerOptions = useMemo(
    () => state.partners.map((partner) => ({ value: partner.name, label: partner.name })),
    [state.partners]
  );

  const partnerColumns = [
    { key: 'name', label: 'Partner' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button
            type="button"
            className="button button-secondary compact-button"
            onClick={() => {
              setPartnerValues(row);
              setPartnerErrors({});
              setPartnerModalOpen(true);
            }}
            data-testid={`partner-edit-${toTestSegment(row.name)}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="button button-danger compact-button"
            onClick={() => setDeleteTarget({ kind: 'partner', row })}
            data-testid={`partner-delete-${toTestSegment(row.name)}`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const rewardColumns = [
    { key: 'title', label: 'Reward' },
    { key: 'partner', label: 'Partner' },
    { key: 'milesCost', label: 'Miles', render: (row) => formatNumber(row.milesCost) },
    {
      key: 'activeTo',
      label: 'Validity',
      render: (row) => (
        <div className="stack gap-xs">
          <span>{row.activeFrom} to {row.activeTo}</span>
          {isWithinWarningWindow(row.activeTo) ? <Badge tone="warning">Ends soon</Badge> : null}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button
            type="button"
            className="button button-secondary compact-button"
            onClick={() => {
              setRewardValues({ ...row, milesCost: String(row.milesCost) });
              setRewardErrors({});
              setRewardModalOpen(true);
            }}
            data-testid={`reward-edit-${toTestSegment(row.title)}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="button button-danger compact-button"
            onClick={() => setDeleteTarget({ kind: 'reward', row })}
            data-testid={`reward-delete-${toTestSegment(row.title)}`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const submitPartner = (event) => {
    event.preventDefault();
    const nextErrors = validatePartner(partnerValues);
    setPartnerErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }
    const nextRows = partnerValues.id
      ? state.partners.map((partner) => (partner.id === partnerValues.id ? partnerValues : partner))
      : [{ ...partnerValues, id: `partner-${Date.now()}` }, ...state.partners];
    savePartners(nextRows);
    setPartnerModalOpen(false);
    setPartnerValues(defaultPartner);
    notify({ type: 'success', title: 'Partner saved', message: 'Partner changes stored locally.' });
  };

  const submitReward = (event) => {
    event.preventDefault();
    const payload = { ...rewardValues, milesCost: Number(rewardValues.milesCost || 0) };
    const nextErrors = validateReward(payload);
    setRewardErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }
    const nextRows = payload.id
      ? state.rewards.map((reward) => (reward.id === payload.id ? payload : reward))
      : [{ ...payload, id: `reward-${Date.now()}` }, ...state.rewards];
    saveRewards(nextRows);
    setRewardModalOpen(false);
    setRewardValues(defaultReward);
    notify({ type: 'success', title: 'Reward saved', message: 'Reward changes stored locally.' });
  };

  return (
    <div className="stack gap-xl" data-testid="admin-rewards-management-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Partner CRUD</div>
            <h2>Partners</h2>
          </div>
          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setPartnerValues(defaultPartner);
              setPartnerErrors({});
              setPartnerModalOpen(true);
            }}
            data-testid="partner-add-button"
          >
            Add Partner
          </button>
        </div>
        <DataTable columns={partnerColumns} rows={state.partners} testId="partners-table" />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Reward CRUD</div>
            <h2>Reward catalog administration</h2>
          </div>
          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setRewardValues(defaultReward);
              setRewardErrors({});
              setRewardModalOpen(true);
            }}
            data-testid="reward-add-button"
          >
            Add Reward
          </button>
        </div>
        <DataTable columns={rewardColumns} rows={state.rewards} testId="rewards-management-table" />
      </section>

      <Modal
        open={partnerModalOpen}
        title={partnerValues.id ? 'Edit partner' : 'Add partner'}
        onClose={() => setPartnerModalOpen(false)}
        testId="partner-modal"
      >
        <form className="stack gap-md" onSubmit={submitPartner}>
          <FormField
            label="Name"
            value={partnerValues.name}
            onChange={(event) => setPartnerValues((current) => ({ ...current, name: event.target.value }))}
            error={partnerErrors.name}
            data-testid="partner-name-input"
          />
          <FormField
            label="Type"
            value={partnerValues.type}
            onChange={(event) => setPartnerValues((current) => ({ ...current, type: event.target.value }))}
            error={partnerErrors.type}
            data-testid="partner-type-input"
          />
          <SelectField
            label="Status"
            value={partnerValues.status}
            onChange={(event) => setPartnerValues((current) => ({ ...current, status: event.target.value }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'Draft', label: 'Draft' },
            ]}
            error={partnerErrors.status}
            data-testid="partner-status-select"
          />
          <div className="dialog-actions">
            <button type="button" className="button button-secondary" onClick={() => setPartnerModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" data-testid="partner-save-button">
              Save Partner
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={rewardModalOpen}
        title={rewardValues.id ? 'Edit reward' : 'Add reward'}
        onClose={() => setRewardModalOpen(false)}
        testId="reward-modal"
      >
        <form className="form-grid" onSubmit={submitReward}>
          <FormField
            label="Title"
            value={rewardValues.title}
            onChange={(event) => setRewardValues((current) => ({ ...current, title: event.target.value }))}
            error={rewardErrors.title}
            data-testid="reward-title-input"
          />
          <FormField
            label="Category"
            value={rewardValues.category}
            onChange={(event) => setRewardValues((current) => ({ ...current, category: event.target.value }))}
            error={rewardErrors.category}
            data-testid="reward-category-input"
          />
          <SelectField
            label="Partner"
            value={rewardValues.partner}
            onChange={(event) => setRewardValues((current) => ({ ...current, partner: event.target.value }))}
            options={partnerOptions}
            error={rewardErrors.partner}
            data-testid="reward-partner-select"
          />
          <FormField
            label="Miles cost"
            type="number"
            value={rewardValues.milesCost}
            onChange={(event) => setRewardValues((current) => ({ ...current, milesCost: event.target.value }))}
            error={rewardErrors.milesCost}
            data-testid="reward-miles-cost-input"
          />
          <SelectField
            label="Status"
            value={rewardValues.status}
            onChange={(event) => setRewardValues((current) => ({ ...current, status: event.target.value }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
            error={rewardErrors.status}
            data-testid="reward-status-select"
          />
          <FormField
            label="Active from"
            type="date"
            value={rewardValues.activeFrom}
            onChange={(event) => setRewardValues((current) => ({ ...current, activeFrom: event.target.value }))}
            error={rewardErrors.activeFrom}
            data-testid="reward-active-from-input"
          />
          <FormField
            label="Active to"
            type="date"
            value={rewardValues.activeTo}
            onChange={(event) => setRewardValues((current) => ({ ...current, activeTo: event.target.value }))}
            error={rewardErrors.activeTo}
            data-testid="reward-active-to-input"
          />
          <FormField
            label="Description"
            multiline
            rows={4}
            value={rewardValues.description}
            onChange={(event) => setRewardValues((current) => ({ ...current, description: event.target.value }))}
            data-testid="reward-description-input"
          />
          <div className="dialog-actions dialog-actions-full">
            <button type="button" className="button button-secondary" onClick={() => setRewardModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" data-testid="reward-save-button">
              Save Reward
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete record"
        description="Remove the selected partner or reward from local state?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget.kind === 'partner') {
            savePartners(state.partners.filter((item) => item.id !== deleteTarget.row.id));
          } else {
            saveRewards(state.rewards.filter((item) => item.id !== deleteTarget.row.id));
          }
          setDeleteTarget(null);
          notify({ type: 'success', title: 'Record deleted', message: 'The selected record was removed.' });
        }}
      />
    </div>
  );
}
