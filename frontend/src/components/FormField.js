export default function FormField({
  label,
  error,
  hint,
  multiline = false,
  type = 'text',
  className = '',
  ...props
}) {
  const Component = multiline ? 'textarea' : 'input';

  return (
    <label className={`form-field ${className}`.trim()}>
      <span className="field-label">{label}</span>
      <Component className={`field-input ${error ? 'field-error' : ''}`} type={multiline ? undefined : type} {...props} />
      {hint ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-feedback">{error}</span> : null}
    </label>
  );
}
