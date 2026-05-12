import { X } from 'lucide-react';

export default function Drawer({
  open,
  title,
  children,
  onClose,
  testId,
  closeTestId = 'drawer-close-button',
  placement = 'side',
}) {
  if (!open) {
    return null;
  }

  return (
    <div className={`overlay ${placement === 'side' ? 'drawer-overlay' : ''}`.trim()} role="presentation">
      <aside className={`drawer drawer-${placement}`.trim()} role="dialog" aria-modal="true" data-testid={testId}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close details"
            data-testid={closeTestId}
          >
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
