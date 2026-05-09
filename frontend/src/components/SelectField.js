export default function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  placeholder = 'Select option',
  className = '',
  ...props
}) {
  return (
    <label className={`form-field ${className}`.trim()}>
      <span className="field-label">{label}</span>
      <select className={`field-input ${error ? 'field-error' : ''}`} value={value} onChange={onChange} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="field-feedback">{error}</span> : null}
    </label>
  );
}
