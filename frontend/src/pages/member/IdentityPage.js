import { useState } from 'react';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import Modal from '../../components/Modal';
import SelectField from '../../components/SelectField';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import { validateIdentity } from '../../utils/validation';

const defaultValues = {
  id: '',
  type: '',
  number: '',
  issuingCountry: '',
  issueDate: '',
  expiryDate: '',
  lifetime: false,
};

export default function IdentityPage() {
  const { state, saveIdentity, deleteIdentity, notify } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openEditor = (identity) => {
    setValues(identity || defaultValues);
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const nextErrors = validateIdentity(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    saveIdentity(values);
    setModalOpen(false);
    setValues(defaultValues);
    notify({
      type: 'success',
      title: 'Identity saved',
      message: 'Document changes applied to the mock profile.',
    });
  };

  const columns = [
    { key: 'type', label: 'Type' },
    { key: 'number', label: 'Document Number' },
    { key: 'issuingCountry', label: 'Issuing Country' },
    { key: 'issueDate', label: 'Issue Date', render: (row) => formatDate(row.issueDate) },
    {
      key: 'expiryDate',
      label: 'Expiry',
      render: (row) => (row.lifetime ? <Badge tone="gold">Lifetime</Badge> : formatDate(row.expiryDate)),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button type="button" className="button button-secondary compact-button" onClick={() => openEditor(row)}>
            Edit
          </button>
          <button type="button" className="button button-danger compact-button" onClick={() => setDeleteTarget(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="stack gap-xl">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Travel readiness</div>
            <h2>Stored identity documents</h2>
          </div>
          <button type="button" className="button button-primary" onClick={() => openEditor(null)}>
            Add Identity
          </button>
        </div>
        <DataTable columns={columns} rows={state.identities} />
      </section>

      <Modal open={modalOpen} title={values.id ? 'Edit identity document' : 'Add identity document'} onClose={() => setModalOpen(false)}>
        <form className="stack gap-md" onSubmit={handleSave}>
          <SelectField
            label="Identity type"
            value={values.type}
            onChange={(event) => setValues((current) => ({ ...current, type: event.target.value }))}
            options={[
              { value: 'Passport', label: 'Passport' },
              { value: 'KTP', label: 'KTP' },
              { value: 'National ID', label: 'National ID' },
              { value: 'Driver License', label: 'Driver License' },
            ]}
            error={errors.type}
          />
          <FormField
            label="Identity number"
            value={values.number}
            onChange={(event) => setValues((current) => ({ ...current, number: event.target.value }))}
            error={errors.number}
          />
          <FormField
            label="Issuing country"
            value={values.issuingCountry}
            onChange={(event) => setValues((current) => ({ ...current, issuingCountry: event.target.value }))}
            error={errors.issuingCountry}
          />
          <FormField
            label="Issue date"
            type="date"
            value={values.issueDate}
            onChange={(event) => setValues((current) => ({ ...current, issueDate: event.target.value }))}
            error={errors.issueDate}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={values.lifetime}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  lifetime: event.target.checked,
                  expiryDate: event.target.checked ? '' : current.expiryDate,
                }))
              }
            />
            <span>KTP lifetime validity</span>
          </label>
          <FormField
            label="Expiry date"
            type="date"
            value={values.expiryDate}
            onChange={(event) => setValues((current) => ({ ...current, expiryDate: event.target.value }))}
            error={errors.expiryDate}
            disabled={values.lifetime}
          />
          <div className="dialog-actions">
            <button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete identity document"
        description={`Remove ${deleteTarget?.type || 'this document'} from the profile?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteIdentity(deleteTarget.id);
          setDeleteTarget(null);
          notify({
            type: 'success',
            title: 'Identity deleted',
            message: 'The selected document has been removed.',
          });
        }}
      />
    </div>
  );
}
