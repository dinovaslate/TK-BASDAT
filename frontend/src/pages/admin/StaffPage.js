import { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import FormField from '../../components/FormField';
import Modal from '../../components/Modal';
import SelectField from '../../components/SelectField';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import { validateStaff } from '../../utils/validation';

const companyDomains = [
  '@oziskies.com',
  '@lionsky.com',
  '@sakuraairways.com',
  '@nusantaraair.com',
  '@bumiairlines.com',
];

const defaultValues = {
  id: '',
  staffId: '',
  salutation: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  countryCode: '+62',
  mobileNumber: '',
  dateOfBirth: '',
  nationality: '',
  airline: '',
  role: '',
  status: '',
};

export default function StaffPage() {
  const { state, saveStaff, deleteStaff, notify } = useAppContext();
  const [search, setSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredStaff = useMemo(
    () => state.staff.filter((person) => Object.values(person).join(' ').toLowerCase().includes(search.toLowerCase())),
    [search, state.staff]
  );

  const staffName = (person) =>
    [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');

  const closeEditor = () => {
    setValues(defaultValues);
    setErrors({});
    setModalOpen(false);
  };

  const openEditor = (person) => {
    setValues(person ? { ...defaultValues, ...person } : defaultValues);
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const payload = {
      ...values,
      staffId: values.staffId.trim().toUpperCase(),
      email: values.email.trim().toLowerCase(),
    };
    const nextErrors = validateStaff(payload, state.staff, payload.id);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    saveStaff(payload);
    closeEditor();
    notify({
      type: 'success',
      title: payload.id ? 'Staff updated' : 'Staff added',
      message: `${payload.staffId} saved to the staff roster.`,
    });
  };

  const columns = [
    { key: 'staffId', label: 'Staff ID' },
    {
      key: 'name',
      label: 'Name',
      render: (row) => staffName(row),
    },
    { key: 'email', label: 'Company Email' },
    { key: 'airline', label: 'Airline' },
    { key: 'role', label: 'Role' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={row.status === 'Active' ? 'success' : 'warning'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row, index) => (
        <div className="table-actions">
          <button
            type="button"
            className="button button-secondary compact-button"
            onClick={() => setSelectedStaff(row)}
            data-testid={`view-staff-${row.staffId}`}
          >
            View
          </button>
          <button
            type="button"
            className="button button-secondary compact-button"
            onClick={() => openEditor(row)}
            data-testid={`edit-staff-${row.staffId}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="button button-danger compact-button"
            onClick={() => setDeleteTarget(row)}
            data-testid={`delete-staff-${row.staffId}`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const rows = filteredStaff.map((row, index) => ({ ...row, index }));

  return (
    <div className="stack gap-xl" data-testid="admin-staff-page">
      <section className="panel">
        <div className="panel-header panel-header-wrap">
          <div>
            <div className="eyebrow">Staff roster</div>
            <h2>Alliance operations staff</h2>
          </div>
          <div className="button-row staff-toolbar">
            <input
              className="field-input search-input"
              placeholder="Search staff"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              data-testid="staff-search-input"
            />
            <button type="button" className="button button-primary" onClick={() => openEditor(null)} data-testid="add-staff-button">
              Add Staff
            </button>
          </div>
        </div>
        <DataTable
          columns={[
            ...columns.slice(0, 6),
            {
              ...columns[6],
              render: (row) => columns[6].render(row, row.index),
            },
          ]}
          rows={rows}
          testId="staff-table"
        />
      </section>

      <Drawer
        open={Boolean(selectedStaff)}
        title={selectedStaff?.staffId || ''}
        onClose={() => setSelectedStaff(null)}
        testId="staff-detail-drawer"
        placement="center"
      >
        {selectedStaff ? (
          <div className="staff-drawer stack gap-lg">
            <section className="staff-drawer-hero">
              <div className="stack gap-xs">
                <div className="eyebrow">Staff profile</div>
                <h4>{staffName(selectedStaff)}</h4>
                <p>{selectedStaff.role}</p>
              </div>
              <div className="staff-drawer-badges">
                <Badge tone={selectedStaff.status === 'Active' ? 'success' : 'warning'}>{selectedStaff.status}</Badge>
                <Badge>{selectedStaff.airline}</Badge>
              </div>
            </section>

            <section className="staff-drawer-grid">
              <div className="staff-drawer-card staff-drawer-card-wide">
                <span className="detail-label">Company email</span>
                <strong>{selectedStaff.email}</strong>
              </div>
              <div className="staff-drawer-card">
                <span className="detail-label">Birth date</span>
                <strong>{formatDate(selectedStaff.dateOfBirth)}</strong>
              </div>
              <div className="staff-drawer-card">
                <span className="detail-label">Country code</span>
                <strong>{selectedStaff.countryCode || '-'}</strong>
              </div>
              <div className="staff-drawer-card">
                <span className="detail-label">Mobile number</span>
                <strong>{selectedStaff.mobileNumber || '-'}</strong>
              </div>
              <div className="staff-drawer-card">
                <span className="detail-label">Nationality</span>
                <strong>{selectedStaff.nationality || '-'}</strong>
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={modalOpen}
        title={values.id ? 'Edit staff' : 'Add staff'}
        description="Maintain alliance identity, contact, and role assignment in one compact record."
        onClose={closeEditor}
        size="wide"
        testId="add-staff-modal"
        bodyClassName="staff-modal-body"
      >
        <form className="staff-modal-form" onSubmit={handleSave}>
          <div className="staff-modal-shell">
            <div className="staff-modal-main">
              <section className="staff-form-section">
                <div className="staff-form-section-header">
                  <h4>Identity</h4>
                  <p>Keep the staff profile readable in dashboards, drawers, and approval workflows.</p>
                </div>
                <div className="staff-form-grid">
                  <FormField
                    label="Staff ID"
                    value={values.staffId}
                    onChange={(event) => setValues((current) => ({ ...current, staffId: event.target.value }))}
                    error={errors.staffId}
                    data-testid="staff-id-input"
                  />
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
                    data-testid="staff-first-name-input"
                  />
                  <FormField
                    label="Middle name"
                    value={values.middleName}
                    onChange={(event) => setValues((current) => ({ ...current, middleName: event.target.value }))}
                  />
                  <FormField
                    label="Last name"
                    value={values.lastName}
                    onChange={(event) => setValues((current) => ({ ...current, lastName: event.target.value }))}
                    data-testid="staff-last-name-input"
                  />
                  <FormField
                    label="Date of birth"
                    type="date"
                    value={values.dateOfBirth}
                    onChange={(event) => setValues((current) => ({ ...current, dateOfBirth: event.target.value }))}
                    data-testid="staff-birth-date-input"
                  />
                </div>
              </section>

              <section className="staff-form-section">
                <div className="staff-form-section-header">
                  <h4>Contact</h4>
                  <p>Use the official company email and reachable phone number for operational escalation.</p>
                </div>
                <div className="staff-form-grid">
                  <FormField
                    className="span-full"
                    label="Company email"
                    value={values.email}
                    onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                    error={errors.email}
                    data-testid="staff-email-input"
                  />
                  <FormField
                    label="Country code"
                    value={values.countryCode}
                    onChange={(event) => setValues((current) => ({ ...current, countryCode: event.target.value }))}
                  />
                  <FormField
                    label="Mobile number"
                    value={values.mobileNumber}
                    onChange={(event) => setValues((current) => ({ ...current, mobileNumber: event.target.value }))}
                    data-testid="staff-mobile-input"
                  />
                  <FormField
                    className="span-full"
                    label="Nationality"
                    value={values.nationality}
                    onChange={(event) => setValues((current) => ({ ...current, nationality: event.target.value }))}
                  />
                </div>
              </section>
            </div>

            <div className="staff-modal-side">
              <section className="staff-form-section">
                <div className="staff-form-section-header">
                  <h4>Assignment</h4>
                  <p>Map the staff record to airline ownership, responsibility, and current roster status.</p>
                </div>
                <div className="staff-form-grid staff-form-grid-single">
                  <SelectField
                    label="Airline"
                    value={values.airline}
                    onChange={(event) => setValues((current) => ({ ...current, airline: event.target.value }))}
                    options={state.masterData.airlines.map((airline) => ({ value: airline.name, label: airline.name }))}
                    error={errors.airline}
                    data-testid="staff-airline-select"
                  />
                  <FormField
                    label="Role"
                    value={values.role}
                    onChange={(event) => setValues((current) => ({ ...current, role: event.target.value }))}
                    error={errors.role}
                    data-testid="staff-role-input"
                  />
                  <SelectField
                    label="Status"
                    value={values.status}
                    onChange={(event) => setValues((current) => ({ ...current, status: event.target.value }))}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Leave', label: 'Leave' },
                      { value: 'Suspended', label: 'Suspended' },
                    ]}
                    data-testid="staff-status-select"
                  />
                </div>
              </section>

              <aside className="staff-policy-card">
                <div className="staff-form-section-header">
                  <h4>Approved domains</h4>
                  <p>Staff records only accept alliance-operated company email domains.</p>
                </div>
                <div className="staff-domain-list">
                  {companyDomains.map((domain) => (
                    <span key={domain} className="staff-domain-pill">
                      {domain}
                    </span>
                  ))}
                </div>
              </aside>
            </div>
          </div>

          <div className="dialog-actions staff-modal-actions">
            <button type="button" className="button button-secondary" onClick={closeEditor}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" data-testid="save-staff-button">
              Save Staff
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete staff record"
        description={`Delete ${deleteTarget?.staffId || 'this staff record'} from the mock roster?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteStaff(deleteTarget.id);
          setDeleteTarget(null);
          notify({
            type: 'success',
            title: 'Staff deleted',
            message: 'Staff removed from the local state list.',
          });
        }}
      />
    </div>
  );
}
