import { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import Drawer from '../../components/Drawer';
import FormField from '../../components/FormField';
import SelectField from '../../components/SelectField';
import { useAppContext } from '../../context/AppContext';
import { formatDate, formatNumber } from '../../utils/formatters';
import { validateClaim } from '../../utils/validation';

const defaultValues = {
  id: '',
  airline: '',
  flightNumber: '',
  flightDate: '',
  origin: '',
  destination: '',
  cabinClass: '',
  ticketNumber: '',
  pnr: '',
  notes: '',
};

export default function ClaimPage() {
  const { state, notify, saveClaim, deleteClaim } = useAppContext();
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submittedClaim, setSubmittedClaim] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const airportOptions = useMemo(
    () => state.masterData.airports.map((airport) => ({ value: airport.code, label: `${airport.code} - ${airport.city}` })),
    [state.masterData.airports]
  );

  const airlineOptions = useMemo(
    () => state.masterData.airlines.map((airline) => ({ value: airline.name, label: airline.name })),
    [state.masterData.airlines]
  );

  const memberClaims = useMemo(
    () =>
      state.claims
        .filter((claim) => claim.memberNumber === state.currentMember.memberNumber)
        .sort((left, right) => new Date(right.submittedAt) - new Date(left.submittedAt)),
    [state.claims, state.currentMember.memberNumber]
  );

  const handleChange = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const openEditor = (claim) => {
    setValues(claim ? { ...claim } : defaultValues);
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateClaim(values);
    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length) {
      return;
    }

    const duplicateClaim = memberClaims.find(
      (claim) =>
        claim.id !== values.id &&
        String(claim.flightNumber || '').trim().toLowerCase() === String(values.flightNumber || '').trim().toLowerCase() &&
        String(claim.flightDate || '').slice(0, 10) === String(values.flightDate || '').slice(0, 10) &&
        String(claim.ticketNumber || '').trim().toLowerCase() === String(values.ticketNumber || '').trim().toLowerCase()
    );

    if (duplicateClaim) {
      const message = `ERROR: Klaim untuk penerbangan "${values.flightNumber}" pada tanggal "${values.flightDate}" dengan nomor tiket "${values.ticketNumber}" sudah pernah diajukan sebelumnya.`;
      setFormError(message);
      notify({
        type: 'error',
        title: 'Claim blocked',
        message,
      });
      return;
    }

    try {
      const claim = await saveClaim(values);
      setSubmittedClaim(claim);
      setValues(defaultValues);
      setErrors({});
      notify({
        type: 'success',
        title: values.id ? 'Claim updated' : 'Claim submitted',
        message: claim.message || `${claim.id} is now pending review.`,
      });
    } catch (error) {
      setFormError(error.message);
      notify({
        type: 'error',
        title: 'Claim blocked',
        message: error.message,
      });
    }
  };

  const canMutateClaim = (claim) => claim.status !== 'Approved';

  const columns = [
    { key: 'id', label: 'Claim ID' },
    { key: 'airline', label: 'Airline' },
    { key: 'flightNumber', label: 'Flight' },
    {
      key: 'route',
      label: 'Route',
      render: (row) => `${row.origin} to ${row.destination}`,
    },
    {
      key: 'requestedMiles',
      label: 'Requested Miles',
      render: (row) => formatNumber(row.requestedMiles),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'Approved' ? 'success' : row.status === 'Rejected' ? 'danger' : 'gold'}>
          {row.status}
        </Badge>
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
            onClick={() => setSelectedClaim(row)}
            data-testid={`view-claim-${row.id}`}
          >
            View
          </button>
          <button
            type="button"
            className="button button-secondary compact-button"
            onClick={() => openEditor(row)}
            disabled={!canMutateClaim(row)}
            data-testid={`edit-claim-${row.id}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="button button-danger compact-button"
            onClick={() => setDeleteTarget(row)}
            disabled={!canMutateClaim(row)}
            data-testid={`delete-claim-${row.id}`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="stack gap-xl">
      <form className="panel" onSubmit={handleSubmit} data-testid="claim-form">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Mileage adjustment</div>
            <h2>{values.id ? 'Update claim submission' : 'Flight details'}</h2>
          </div>
        </div>

        <div className="form-grid">
          <SelectField
            label="Airline"
            value={values.airline}
            onChange={(event) => handleChange('airline', event.target.value)}
            options={airlineOptions}
            error={errors.airline}
            data-testid="claim-airline-select"
          />
          <FormField
            label="Flight number"
            value={values.flightNumber}
            onChange={(event) => handleChange('flightNumber', event.target.value)}
            error={errors.flightNumber}
            data-testid="claim-flight-number-input"
          />
          <FormField
            label="Flight date"
            type="date"
            value={values.flightDate}
            onChange={(event) => handleChange('flightDate', event.target.value)}
            error={errors.flightDate}
            data-testid="claim-flight-date-input"
          />
          <SelectField
            label="Cabin class"
            value={values.cabinClass}
            onChange={(event) => handleChange('cabinClass', event.target.value)}
            options={[
              { value: 'Economy', label: 'Economy' },
              { value: 'Premium Economy', label: 'Premium Economy' },
              { value: 'Business', label: 'Business' },
              { value: 'First', label: 'First' },
            ]}
            error={errors.cabinClass}
            data-testid="claim-cabin-class-select"
          />
          <SelectField
            label="Origin airport"
            value={values.origin}
            onChange={(event) => handleChange('origin', event.target.value)}
            options={airportOptions}
            error={errors.origin}
            data-testid="claim-origin-select"
          />
          <SelectField
            label="Destination airport"
            value={values.destination}
            onChange={(event) => handleChange('destination', event.target.value)}
            options={airportOptions}
            error={errors.destination}
            data-testid="claim-destination-select"
          />
          <FormField
            label="Ticket number"
            value={values.ticketNumber}
            onChange={(event) => handleChange('ticketNumber', event.target.value)}
            error={errors.ticketNumber}
            data-testid="claim-ticket-number-input"
          />
          <FormField
            label="PNR"
            value={values.pnr}
            onChange={(event) => handleChange('pnr', event.target.value)}
            error={errors.pnr}
            data-testid="claim-pnr-input"
          />
          <FormField
            className="claim-notes-field span-full"
            label="Notes"
            multiline
            rows={4}
            value={values.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
            hint="Optional supporting context for the reviewer."
            data-testid="claim-notes-input"
          />
        </div>

        <div className="panel-actions claim-submit-row">
          {formError ? <div className="error-banner span-full">{formError}</div> : null}
          {values.id ? (
            <button type="button" className="button button-secondary" onClick={() => openEditor(null)} data-testid="claim-cancel-edit">
              Cancel Edit
            </button>
          ) : null}
          <button type="submit" className="button button-primary" data-testid="claim-submit">
            {values.id ? 'Update Claim' : 'Submit Claim'}
          </button>
        </div>
      </form>

      {submittedClaim ? (
        <section className="panel success-panel" data-testid="claim-success">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Submission complete</div>
              <h2>{submittedClaim.id}</h2>
            </div>
            <strong className="status-emphasis">Pending Review</strong>
          </div>
          <p>Your claim is queued for staff review. You can continue with purchases, transfers, or rewards while this stays pending.</p>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Claim history</div>
            <h2>Submitted missing miles cases</h2>
          </div>
        </div>
        <DataTable columns={columns} rows={memberClaims} testId="member-claims-table" />
      </section>

      <Drawer
        open={Boolean(selectedClaim)}
        title={selectedClaim?.id || ''}
        onClose={() => setSelectedClaim(null)}
        testId="member-claim-detail"
        placement="center"
      >
        {selectedClaim ? (
          <div className="stack gap-lg">
            <div className="detail-grid">
              <div>
                <span className="detail-label">Status</span>
                <strong>{selectedClaim.status}</strong>
              </div>
              <div>
                <span className="detail-label">Submitted on</span>
                <strong>{formatDate(selectedClaim.submittedAt)}</strong>
              </div>
              <div>
                <span className="detail-label">Flight</span>
                <strong>{selectedClaim.airline} {selectedClaim.flightNumber}</strong>
              </div>
              <div>
                <span className="detail-label">Route</span>
                <strong>{selectedClaim.origin} to {selectedClaim.destination}</strong>
              </div>
              <div>
                <span className="detail-label">Requested miles</span>
                <strong>{formatNumber(selectedClaim.requestedMiles)}</strong>
              </div>
              <div>
                <span className="detail-label">Cabin class</span>
                <strong>{selectedClaim.cabinClass}</strong>
              </div>
            </div>
            {selectedClaim.reviewerNote ? (
              <div className="wallet-note">
                Reviewer note: {selectedClaim.reviewerNote}
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete claim"
        description={`Delete ${deleteTarget?.id || 'this claim'} from the member request list?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteClaim(deleteTarget.id);
          if (selectedClaim?.id === deleteTarget.id) {
            setSelectedClaim(null);
          }
          if (submittedClaim?.id === deleteTarget.id) {
            setSubmittedClaim(null);
          }
          setDeleteTarget(null);
          notify({
            type: 'success',
            title: 'Claim deleted',
            message: 'The selected claim has been removed.',
          });
        }}
      />
    </div>
  );
}
