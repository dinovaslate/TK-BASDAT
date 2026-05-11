import { useEffect, useMemo, useState } from 'react';
import FormField from '../../components/FormField';
import SelectField from '../../components/SelectField';
import { useAppContext } from '../../context/AppContext';
import { formatDate, formatNumber } from '../../utils/formatters';
import { validateMember } from '../../utils/validation';

export default function ProfileSettingsPage() {
  const { state, saveMember, notify } = useAppContext();
  const [values, setValues] = useState(state.currentMember);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(state.currentMember);
  }, [state.currentMember]);

  const airportOptions = useMemo(
    () => state.masterData.airports.map((airport) => ({ value: airport.code, label: `${airport.code} - ${airport.city}` })),
    [state.masterData.airports]
  );

  const handleChange = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...values,
      email: values.email.trim().toLowerCase(),
      memberNumber: values.memberNumber.trim().toUpperCase(),
    };
    const nextErrors = validateMember(payload, state.members, payload.id);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    saveMember(payload);
    notify({
      type: 'success',
      title: 'Profile updated',
      message: 'Member profile settings were saved.',
    });
  };

  return (
    <div className="two-column-grid profile-layout" data-testid="member-profile-page">
      <section className="panel profile-summary-card">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Account profile</div>
            <h2>{values.memberNumber}</h2>
          </div>
        </div>
        <div className="stack gap-md">
          <div className="summary-row">
            <span>Member name</span>
            <strong>{values.firstName} {values.lastName}</strong>
          </div>
          <div className="summary-row">
            <span>Tier</span>
            <strong>{values.tier}</strong>
          </div>
          <div className="summary-row">
            <span>Join date</span>
            <strong>{formatDate(values.joinDate)}</strong>
          </div>
          <div className="summary-row">
            <span>Award miles</span>
            <strong>{formatNumber(values.awardMiles)}</strong>
          </div>
          <div className="summary-row">
            <span>Tier miles</span>
            <strong>{formatNumber(values.tierMiles)}</strong>
          </div>
          <div className="summary-row">
            <span>Status</span>
            <strong>{values.status}</strong>
          </div>
        </div>
      </section>

      <form className="panel stack gap-lg" onSubmit={handleSubmit}>
        <div className="panel-header">
          <div>
            <div className="eyebrow">Profile settings</div>
            <h2>Traveler and communication preferences</h2>
          </div>
        </div>

        <div className="form-grid">
          <SelectField
            label="Salutation"
            value={values.salutation}
            onChange={(event) => handleChange('salutation', event.target.value)}
            options={[
              { value: 'Mr', label: 'Mr' },
              { value: 'Ms', label: 'Ms' },
              { value: 'Mrs', label: 'Mrs' },
            ]}
          />
          <FormField
            label="First name"
            value={values.firstName}
            onChange={(event) => handleChange('firstName', event.target.value)}
            error={errors.firstName}
            data-testid="member-profile-first-name-input"
          />
          <FormField
            label="Middle name"
            value={values.middleName}
            onChange={(event) => handleChange('middleName', event.target.value)}
          />
          <FormField
            label="Last name"
            value={values.lastName}
            onChange={(event) => handleChange('lastName', event.target.value)}
          />
          <FormField
            className="span-full"
            label="Email"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            error={errors.email}
            data-testid="member-profile-email-input"
          />
          <FormField
            label="Country code"
            value={values.countryCode}
            onChange={(event) => handleChange('countryCode', event.target.value)}
          />
          <FormField
            label="Mobile number"
            value={values.mobileNumber}
            onChange={(event) => handleChange('mobileNumber', event.target.value)}
          />
          <FormField
            label="Date of birth"
            type="date"
            value={values.dateOfBirth}
            onChange={(event) => handleChange('dateOfBirth', event.target.value)}
          />
          <FormField
            label="Nationality"
            value={values.nationality}
            onChange={(event) => handleChange('nationality', event.target.value)}
          />
          <SelectField
            label="Preferred airport"
            value={values.preferredAirport || ''}
            onChange={(event) => handleChange('preferredAirport', event.target.value)}
            options={airportOptions}
            data-testid="member-profile-airport-select"
          />
          <SelectField
            label="Seat preference"
            value={values.seatPreference || ''}
            onChange={(event) => handleChange('seatPreference', event.target.value)}
            options={[
              { value: 'Aisle', label: 'Aisle' },
              { value: 'Window', label: 'Window' },
              { value: 'Middle', label: 'Middle' },
            ]}
          />
          <SelectField
            label="Primary communication channel"
            value={values.communicationChannel || ''}
            onChange={(event) => handleChange('communicationChannel', event.target.value)}
            options={[
              { value: 'Email', label: 'Email' },
              { value: 'SMS', label: 'SMS' },
              { value: 'WhatsApp', label: 'WhatsApp' },
            ]}
          />
          <label className="checkbox-row span-full profile-checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(values.marketingOptIn)}
              onChange={(event) => handleChange('marketingOptIn', event.target.checked)}
              data-testid="member-profile-marketing-checkbox"
            />
            <span>Receive reward and mileage promotion updates</span>
          </label>
        </div>

        <div className="dialog-actions">
          <button type="submit" className="button button-primary" data-testid="member-profile-save-button">
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
