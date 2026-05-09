import { useMemo, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import Modal from '../../components/Modal';
import { useAppContext } from '../../context/AppContext';
import { formatCurrencyIdr } from '../../utils/formatters';
import { validateMasterItem } from '../../utils/validation';

const keyFieldBySection = {
  airlines: 'code',
  airports: 'code',
  tiers: 'name',
  milesPackages: 'amount',
};

const sectionConfigs = {
  airlines: {
    title: 'Airlines',
    fields: ['code', 'name', 'status'],
    defaults: { id: '', code: '', name: '', status: 'Active' },
  },
  airports: {
    title: 'Airports',
    fields: ['code', 'city', 'country'],
    defaults: { id: '', code: '', city: '', country: '' },
  },
  tiers: {
    title: 'Tiers',
    fields: ['name', 'threshold', 'perks'],
    defaults: { id: '', name: '', threshold: '', perks: '' },
  },
  milesPackages: {
    title: 'Miles Packages',
    fields: ['amount', 'price'],
    defaults: { id: '', amount: '', price: '' },
  },
};

const toTestSegment = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function MasterDataPage() {
  const { state, saveMasterSection, notify } = useAppContext();
  const [editor, setEditor] = useState({ section: '', values: null });
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const sectionEntries = useMemo(
    () =>
      Object.entries(sectionConfigs).map(([key, config]) => ({
        key,
        config,
        rows: state.masterData[key],
      })),
    [state.masterData]
  );

  const openEditor = (section, row) => {
    setEditor({
      section,
      values: row ? { ...row } : { ...sectionConfigs[section].defaults },
    });
    setErrors({});
  };

  const handleSave = (event) => {
    event.preventDefault();
    const { section, values } = editor;
    const rows = state.masterData[section];
    const payload =
      section === 'tiers'
        ? { ...values, threshold: Number(values.threshold || 0) }
        : section === 'milesPackages'
          ? {
              ...values,
              amount: Number(values.amount || 0),
              price: Number(values.price || 0),
              label: `${Number(values.amount || 0).toLocaleString('en-US')} Award Miles`,
            }
          : values;
    const nextErrors = validateMasterItem(section, payload, rows, payload.id);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const nextRows = payload.id
      ? rows.map((row) => (row.id === payload.id ? payload : row))
      : [{ ...payload, id: `${section}-${Date.now()}` }, ...rows];

    saveMasterSection(section, nextRows);
    setEditor({ section: '', values: null });
    notify({
      type: 'success',
      title: `${sectionConfigs[section].title} updated`,
      message: 'Master data saved to local state.',
    });
  };

  const buildColumns = (section) => {
    if (section === 'milesPackages') {
      return [
        { key: 'amount', label: 'Amount', render: (row) => row.amount.toLocaleString('en-US') },
        { key: 'price', label: 'Price', render: (row) => formatCurrencyIdr(row.price) },
        actionColumn(section),
      ];
    }

    return [
      ...sectionConfigs[section].fields.map((field) => ({ key: field, label: field.charAt(0).toUpperCase() + field.slice(1) })),
      actionColumn(section),
    ];
  };

  const actionColumn = (section) => ({
    key: 'actions',
    label: 'Actions',
    render: (row) => (
      <div className="table-actions">
        <button
          type="button"
          className="button button-secondary compact-button"
          onClick={() => openEditor(section, row)}
          data-testid={`master-edit-${section}-${toTestSegment(row[keyFieldBySection[section]])}`}
        >
          Edit
        </button>
        <button
          type="button"
          className="button button-danger compact-button"
          onClick={() => setDeleteTarget({ section, row })}
          data-testid={`master-delete-${section}-${toTestSegment(row[keyFieldBySection[section]])}`}
        >
          Delete
        </button>
      </div>
    ),
  });

  return (
    <div className="stack gap-xl" data-testid="admin-master-data-page">
      {sectionEntries.map(({ key, config, rows }) => (
        <section key={key} className="panel" data-testid={`master-section-${key}`}>
          <div className="panel-header">
            <div>
              <div className="eyebrow">Compact CRUD</div>
              <h2>{config.title}</h2>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={() => openEditor(key, null)}
              data-testid={`master-add-${key}`}
            >
              Add {config.title.slice(0, -1)}
            </button>
          </div>
          <DataTable columns={buildColumns(key)} rows={rows} testId={`master-table-${key}`} />
        </section>
      ))}

      <Modal
        open={Boolean(editor.values)}
        title={
          editor.section
            ? `${editor.values?.id ? 'Edit' : 'Add'} ${sectionConfigs[editor.section].title.slice(0, -1)}`
            : ''
        }
        onClose={() => setEditor({ section: '', values: null })}
        testId="master-editor-modal"
      >
        {editor.values ? (
          <form className="form-grid" onSubmit={handleSave} data-testid="master-editor-form">
            {sectionConfigs[editor.section].fields.map((field) => (
              <FormField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                type={field === 'threshold' || field === 'amount' || field === 'price' ? 'number' : 'text'}
                value={editor.values[field] ?? ''}
                onChange={(event) =>
                  setEditor((current) => ({
                    ...current,
                    values: { ...current.values, [field]: event.target.value },
                  }))
                }
                error={errors[field]}
                data-testid={`master-field-${field}`}
              />
            ))}
            <div className="dialog-actions dialog-actions-full">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setEditor({ section: '', values: null })}
                data-testid="master-cancel-button"
              >
                Cancel
              </button>
              <button type="submit" className="button button-primary" data-testid="master-save-button">
                Save
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete master data row"
        description="This removes the item from the mocked master data section."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const rows = state.masterData[deleteTarget.section].filter((row) => row.id !== deleteTarget.row.id);
          saveMasterSection(deleteTarget.section, rows);
          setDeleteTarget(null);
          notify({
            type: 'success',
            title: 'Master data deleted',
            message: 'Row removed from local state.',
          });
        }}
      />
    </div>
  );
}
