import { X } from 'lucide-react';

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = 'default',
  testId,
  bodyClassName = '',
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="overlay" role="presentation">
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" data-testid={testId}>
        <div className="modal-header">
          <div className="modal-copy">
            <h3>{title}</h3>
            {description ? <p className="modal-description">{description}</p> : null}
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            data-testid="modal-close-button"
          >
            <X size={18} />
          </button>
        </div>
        <div className={`modal-body ${bodyClassName}`.trim()}>{children}</div>
      </div>
    </div>
  );
}
