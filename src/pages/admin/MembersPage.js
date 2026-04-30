import { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import FormField from '../../components/FormField';
import Modal from '../../components/Modal';
import SelectField from '../../components/SelectField';
import { useAppContext } from '../../context/AppContext';
import { formatDate, formatNumber } from '../../utils/formatters';
import { validateMember } from '../../utils/validation';

const defaultValues = {
  id: '',
  salutation: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  countryCode: '+62',
  mobileNumber: '',
  dateOfBirth: '',
  nationality: '',
  memberNumber: '',
  joinDate: '',
  tier: '',
  awardMiles: '',
  tierMiles: '',
  status: '',
};

export default function MembersPage() {
  const { state, saveMember, deleteMember, notify } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredMembers = useMemo(() => {
    return state.members.filter((member) => {
      const haystack = Object.values(member).join(' ').toLowerCase();
      const matchesQuery = haystack.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || member.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [search, state.members, statusFilter]);

  const openEditor = (member) => {
    setValues(
      member
        ? { ...member, awardMiles: String(member.awardMiles), tierMiles: String(member.tierMiles) }
        : { ...defaultValues, joinDate: new Date().toISOString().slice(0, 10) }
    );
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const payload = {
      ...values,
      email: values.email.trim().toLowerCase(),
      memberNumber: values.memberNumber.trim().toUpperCase(),
      awardMiles: Number(values.awardMiles || 0),
      tierMiles: Number(values.tierMiles || 0),
    };
    const nextErrors = validateMember(payload, state.members, payload.id);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    saveMember(payload);
    setModalOpen(false);
    notify({
      type: 'success',
      title: payload.id ? 'Member updated' : 'Member added',
      message: `${payload.memberNumber} saved to the member roster.`,
    });
  };

  const columns = [
    { key: 'memberNumber', label: 'Member Number' },
    {
      key: 'name',
      label: 'Name',
      render: (row) => `${row.firstName} ${row.middleName ? `${row.middleName} ` : ''}${row.lastName}`,
    },
    { key: 'email', label: 'Email' },
    {
      key: 'tier',
      label: 'Tier',
      render: (row) => <Badge tone={row.tier === 'Platinum' ? 'success' : row.tier === 'Gold' ? 'gold' : 'default'}>{row.tier}</Badge>,
    },
    { key: 'awardMiles', label: 'Award Miles', render: (row) => formatNumber(row.awardMiles) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={row.status === 'Active' ? 'success' : row.status === 'Suspended' ? 'danger' : 'warning'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button type="button" className="button button-secondary compact-button" onClick={() => setSelectedMember(row)}>
            View
          </button>
          <button type="button" className="button button-secondary compact-button" onClick={() => openEditor(row)}>
            Edit
          </button>
          <button
            type="button"
            className="button button-danger compact-button"
            onClick={() => setDeleteTarget(row)}
            data-testid={`delete-member-${row.memberNumber}`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="stack gap-xl" data-testid="admin-members-page">
      <section className="panel">
        <div className="panel-header panel-header-stack">
          <div>
            <div className="eyebrow">Member roster</div>
            <h2>Alliance loyalty members</h2>
          </div>
          <div className="management-toolbar">
            <input
              className="field-input search-input"
              placeholder="Search members"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="field-input compact-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
            <button type="button" className="button button-primary" onClick={() => openEditor(null)} data-testid="add-member-button">
              Add Member
            </button>
          </div>
        </div>
        <DataTable columns={columns} rows={filteredMembers} testId="member-table" />
      </section>

      <Drawer open={Boolean(selectedMember)} title={selectedMember?.memberNumber || ''} onClose={() => setSelectedMember(null)}>
        {selectedMember ? (
          <div className="stack gap-md">
            <div className="detail-row"><span className="detail-label">Name</span><strong>{selectedMember.firstName} {selectedMember.lastName}</strong></div>
            <div className="detail-row"><span className="detail-label">Email</span><strong>{selectedMember.email}</strong></div>
            <div className="detail-row"><span className="detail-label">Join date</span><strong>{formatDate(selectedMember.joinDate)}</strong></div>
            <div className="detail-row"><span className="detail-label">Tier</span><strong>{selectedMember.tier}</strong></div>
            <div className="detail-row"><span className="detail-label">Award miles</span><strong>{formatNumber(selectedMember.awardMiles)}</strong></div>
            <div className="detail-row"><span className="detail-label">Tier miles</span><strong>{formatNumber(selectedMember.tierMiles)}</strong></div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={modalOpen}
        title={values.id ? 'Edit member' : 'Add member'}
        onClose={() => setModalOpen(false)}
        testId="add-member-modal"
      >
        <form className="form-grid" onSubmit={handleSave}>
          <SelectField
            label="Salutation"
            value={values.salutation}
            onChange={(event) => setValues((current) => ({ ...current, salutation: event.target.value }))}
            options={[
              { value: 'Mr', label: 'Mr' },
              { value: 'Ms', label: 'Ms' },
              { value: 'Mrs', label: 'Mrs' },
            ]}
          />
          <FormField
            label="First name"
            value={values.firstName}
            onChange={(event) => setValues((current) => ({ ...current, firstName: event.target.value }))}
            error={errors.firstName}
            data-testid="member-first-name-input"
          />
          <FormField label="Middle name" value={values.middleName} onChange={(event) => setValues((current) => ({ ...current, middleName: event.target.value }))} />
          <FormField
            label="Last name"
            value={values.lastName}
            onChange={(event) => setValues((current) => ({ ...current, lastName: event.target.value }))}
            data-testid="member-last-name-input"
          />
          <FormField
            label="Email"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            error={errors.email}
            data-testid="member-email-input"
          />
          <FormField label="Country code" value={values.countryCode} onChange={(event) => setValues((current) => ({ ...current, countryCode: event.target.value }))} />
          <FormField label="Mobile number" value={values.mobileNumber} onChange={(event) => setValues((current) => ({ ...current, mobileNumber: event.target.value }))} />
          <FormField label="Date of birth" type="date" value={values.dateOfBirth} onChange={(event) => setValues((current) => ({ ...current, dateOfBirth: event.target.value }))} />
          <FormField label="Nationality" value={values.nationality} onChange={(event) => setValues((current) => ({ ...current, nationality: event.target.value }))} />
          <FormField
            label="Member number"
            value={values.memberNumber}
            onChange={(event) => setValues((current) => ({ ...current, memberNumber: event.target.value }))}
            error={errors.memberNumber}
            data-testid="member-number-input"
          />
          <FormField label="Join date" type="date" value={values.joinDate} onChange={(event) => setValues((current) => ({ ...current, joinDate: event.target.value }))} />
          <SelectField
            label="Tier"
            value={values.tier}
            onChange={(event) => setValues((current) => ({ ...current, tier: event.target.value }))}
            options={state.masterData.tiers.map((tier) => ({ value: tier.name, label: tier.name }))}
            error={errors.tier}
            data-testid="member-tier-select"
          />
          <FormField label="Award miles" type="number" value={values.awardMiles} onChange={(event) => setValues((current) => ({ ...current, awardMiles: event.target.value }))} />
          <FormField label="Tier miles" type="number" value={values.tierMiles} onChange={(event) => setValues((current) => ({ ...current, tierMiles: event.target.value }))} />
          <SelectField
            label="Status"
            value={values.status}
            onChange={(event) => setValues((current) => ({ ...current, status: event.target.value }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Suspended', label: 'Suspended' },
              { value: 'Pending', label: 'Pending' },
            ]}
            error={errors.status}
            data-testid="member-status-select"
          />

          <div className="dialog-actions dialog-actions-full">
            <button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" data-testid="save-member-button">
              Save Member
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete member"
        description={`Delete ${deleteTarget?.memberNumber || 'this member'} from the mock roster?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteMember(deleteTarget.id);
          setDeleteTarget(null);
          notify({
            type: 'success',
            title: 'Member deleted',
            message: 'Member removed from the local state list.',
          });
        }}
      />
    </div>
  );
}
