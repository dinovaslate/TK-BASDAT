import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import { useAppContext } from '../context/AppContext';
import { validateRegistration } from '../utils/validation';

const tabs = [
  { id: 'member', label: 'Member Registration' },
  { id: 'staff', label: 'Staff Registration' },
];

const defaultValues = {
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
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const { state, notify, registerMember, registerStaff } = useAppContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get('role') === 'staff' ? 'staff' : 'member';

  const [role, setRole] = useState(initialRole);
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setRole(initialRole);
    setValues(defaultValues);
    setErrors({});
    setFormError('');
  }, [initialRole]);

  const sessionRedirect = useMemo(() => {
    if (state.session?.role === 'member') {
      return '/member/dashboard';
    }
    if (state.session?.role === 'staff') {
      return '/admin/dashboard';
    }
    return '';
  }, [state.session]);

  if (sessionRedirect) {
    return <Navigate to={sessionRedirect} replace />;
  }

  const handleChange = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegistration({ roleType: role, ...values }, state.members, state.staff);
    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length) {
      return;
    }

    try {
      if (role === 'member') {
        const member = await registerMember(values);
        notify({
          type: 'success',
          title: 'Member account created',
          message: member.message || `${member.memberNumber} is ready to use.`,
        });
        navigate('/member/dashboard');
        return;
      }

      const person = await registerStaff(values);
      notify({
        type: 'success',
        title: 'Staff account created',
        message: person.message || `${person.staffId} now has operations access.`,
      });
      navigate('/admin/dashboard');
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card register-card" data-testid="register-page">
        <div className="login-aside">
          <div className="hero-kicker">AeroMiles</div>
          <h1>Register a mock loyalty or operations account for full front-end testing.</h1>
            <p>
            Registration uses the backend when available, with local demo state kept for offline UI testing.
          </p>
        </div>

        <div className="login-panel register-panel">
          <div className="segmented-control">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`segment ${role === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setRole(tab.id);
                  setValues(defaultValues);
                  setErrors({});
                }}
                data-testid={tab.id === 'member' ? 'register-member-tab' : 'register-staff-tab'}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
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
              data-testid="register-first-name-input"
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
              data-testid="register-last-name-input"
            />
            <FormField
              className="span-full"
              label={role === 'member' ? 'Personal email' : 'Company email'}
              value={values.email}
              onChange={(event) => handleChange('email', event.target.value)}
              error={errors.email}
              data-testid="register-email-input"
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

            {role === 'member' ? (
              <>
                <FormField
                  label="Date of birth"
                  type="date"
                  value={values.dateOfBirth}
                  onChange={(event) => handleChange('dateOfBirth', event.target.value)}
                  error={errors.dateOfBirth}
                  data-testid="register-dob-input"
                />
                <FormField
                  label="Nationality"
                  value={values.nationality}
                  onChange={(event) => handleChange('nationality', event.target.value)}
                  error={errors.nationality}
                  data-testid="register-nationality-input"
                />
              </>
            ) : (
              <>
                <SelectField
                  label="Airline"
                  value={values.airline}
                  onChange={(event) => handleChange('airline', event.target.value)}
                  options={state.masterData.airlines.map((airline) => ({ value: airline.code || airline.name, label: airline.name }))}
                  error={errors.airline}
                  data-testid="register-airline-select"
                />
                <FormField
                  label="Role"
                  value={values.role}
                  onChange={(event) => handleChange('role', event.target.value)}
                  error={errors.role}
                  data-testid="register-role-input"
                />
              </>
            )}

            <FormField
              label="Password"
              type="password"
              value={values.password}
              onChange={(event) => handleChange('password', event.target.value)}
              error={errors.password}
              data-testid="register-password-input"
            />
            <FormField
              label="Confirm password"
              type="password"
              value={values.confirmPassword}
              onChange={(event) => handleChange('confirmPassword', event.target.value)}
              error={errors.confirmPassword}
              data-testid="register-confirm-password-input"
            />

            {formError ? (
              <div className="error-banner span-full" data-testid="register-error">
                {formError}
              </div>
            ) : null}

            <div className="dialog-actions dialog-actions-full">
              <Link to={`/login?role=${role}`} className="button button-secondary" data-testid="register-login-link">
                Back to Login
              </Link>
              <button type="submit" className="button button-primary" data-testid="register-submit">
                Create Account
              </button>
            </div>
          </form>

          <div className="auth-footer-row">
            <span className="muted-text">Already have access?</span>
            <Link to={`/login?role=${role}`} className="auth-link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
