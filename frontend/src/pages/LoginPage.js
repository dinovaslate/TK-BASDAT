import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import FormField from '../components/FormField';
import { useAppContext } from '../context/AppContext';
import { validateCredentials, validateLogin } from '../utils/validation';

const tabs = [
  { id: 'member', label: 'Member Login' },
  { id: 'staff', label: 'Staff Login' },
];

export default function LoginPage() {
  const { state, login } = useAppContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get('role') === 'staff' ? 'staff' : 'member';

  const [role, setRole] = useState(initialRole);
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setRole(initialRole);
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateLogin({ role, ...values });
    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length) {
      return;
    }

    const credentialError = validateCredentials({ role, ...values });
    if (credentialError) {
      setFormError(credentialError);
      return;
    }

    if (role === 'member') {
      login({
        role: 'member',
        email: state.currentMember.email,
        name: `${state.currentMember.firstName} ${state.currentMember.lastName}`,
      });
      navigate('/member/dashboard');
      return;
    }

    const staff = state.staff.find((person) => person.email === values.email.trim().toLowerCase());
    login({
      role: 'staff',
      email: values.email.trim().toLowerCase(),
      name: staff ? `${staff.firstName} ${staff.lastName}` : 'AeroMiles Staff',
    });
    navigate('/admin/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-aside">
          <div className="hero-kicker">AeroMiles</div>
          <h1>Secure access for members and alliance operations teams.</h1>
          <p>Use the mock credentials from the README to exercise both the customer and staff flows.</p>
        </div>

        <div className="login-panel">
          <div className="segmented-control">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`segment ${role === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setRole(tab.id);
                  setFormError('');
                  setErrors({});
                }}
                data-testid={tab.id === 'member' ? 'login-member-tab' : 'login-staff-tab'}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form className="stack gap-md" onSubmit={handleSubmit}>
            <FormField
              label={role === 'member' ? 'Personal email' : 'Company email'}
              placeholder={role === 'member' ? 'adi.pratama@gmail.com' : 'raka.mahendra@oziskies.com'}
              value={values.email}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              error={errors.email}
              data-testid="login-email-input"
            />
            <FormField
              label="Password"
              type="password"
              placeholder="password123"
              value={values.password}
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
              error={errors.password}
              data-testid="login-password-input"
            />
            {formError ? (
              <div className="error-banner" data-testid="login-error">
                {formError}
              </div>
            ) : null}
            <button type="submit" className="button button-primary button-block" data-testid="login-submit">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
