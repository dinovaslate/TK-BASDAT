import { useEffect, useState } from 'react';
import FormField from '../../components/FormField';
import SelectField from '../../components/SelectField';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import { validateStaff } from '../../utils/validation';

export default function AdminProfilePage() {
  const { state, saveStaff, notify } = useAppContext();
  const [values, setValues] = useState(state.currentStaff);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(state.currentStaff);
  }, [state.currentStaff]);

  const handleChange = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event) => {
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
    notify({
      type: 'success',
      title: 'Profile updated',
      message: 'Staff profile settings were saved.',
    });
  };

  return (
    <div className="two-column-grid profile-layout" data-testid="admin-profile-page">
      <section className="panel profile-summary-card">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Staff identity</div>
            <h2>{values.staffId}</h2>
          </div>
        </div>
        <div className="stack gap-md">
          <div className="summary-row">
            <span>Name</span>
            <strong>{values.firstName} {values.lastName}</strong>
          </div>
          <div className="summary-row">
            <span>Airline</span>
            <strong>{values.airline}</strong>
          </div>
          <div className="summary-row">
            <span>Role</span>
            <strong>{values.role}</strong>
          </div>
          <div className="summary-row">
            <span>Status</span>
            <strong>{values.status}</strong>
          </div>
          <div className="summary-row">
            <span>Birth date</span>
            <strong>{values.dateOfBirth ? formatDate(values.dateOfBirth) : '-'}</strong>
          </div>
        </div>
      </section>

      <form className="panel stack gap-lg" onSubmit={handleSubmit}>
        <div className="panel-header">
          <div>
            <div className="eyebrow">Profile settings</div>
            <h2>Operational contact and alert preferences</h2>
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
            data-testid="admin-profile-first-name-input"
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
            label="Company email"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            error={errors.email}
            data-testid="admin-profile-email-input"
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
            data-testid="admin-profile-mobile-input"
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
          <FormField
            label="Workspace"
            value={values.workspace || ''}
            onChange={(event) => handleChange('workspace', event.target.value)}
            data-testid="admin-profile-workspace-input"
          />
          <SelectField
            label="Alert digest"
            value={values.alertDigest || ''}
            onChange={(event) => handleChange('alertDigest', event.target.value)}
            options={[
              { value: 'Real-time', label: 'Real-time' },
              { value: 'Daily', label: 'Daily' },
              { value: 'Weekly', label: 'Weekly' },
            ]}
            data-testid="admin-profile-alert-digest-select"
          />
          <label className="checkbox-row span-full profile-checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(values.escalationAlerts)}
              onChange={(event) => handleChange('escalationAlerts', event.target.checked)}
              data-testid="admin-profile-escalation-checkbox"
            />
            <span>Receive escalation alerts for claims, redemptions, and data warnings</span>
          </label>
        </div>

        <div className="dialog-actions">
          <button type="submit" className="button button-primary" data-testid="admin-profile-save-button">
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
