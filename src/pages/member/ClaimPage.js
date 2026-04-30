import { useMemo, useState } from 'react';
import FormField from '../../components/FormField';
import SelectField from '../../components/SelectField';
import { useAppContext } from '../../context/AppContext';
import { validateClaim } from '../../utils/validation';

const defaultValues = {
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
  const { state, notify, submitClaim } = useAppContext();
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [submittedClaim, setSubmittedClaim] = useState(null);

  const airportOptions = useMemo(
    () => state.masterData.airports.map((airport) => ({ value: airport.code, label: `${airport.code} - ${airport.city}` })),
    [state.masterData.airports]
  );

  const airlineOptions = useMemo(
    () => state.masterData.airlines.map((airline) => ({ value: airline.name, label: airline.name })),
    [state.masterData.airlines]
  );

  const handleChange = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateClaim(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const claim = submitClaim(values);
    setSubmittedClaim(claim);
    setValues(defaultValues);
    setErrors({});
    notify({
      type: 'success',
      title: 'Claim submitted',
      message: `${claim.id} is now pending review.`,
    });
  };

  return (
    <div className="stack gap-xl">
      <form className="panel" onSubmit={handleSubmit} data-testid="claim-form">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Mileage adjustment</div>
            <h2>Flight details</h2>
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
            className="claim-notes-field"
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
          <button type="submit" className="button button-primary" data-testid="claim-submit">
            Submit Claim
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
    </div>
  );
}
