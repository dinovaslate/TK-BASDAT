import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} size="compact">
      <div className="stack gap-md">
        <p className="muted-text">{description}</p>
        <div className="dialog-actions">
          <button type="button" className="button button-secondary" onClick={onCancel} data-testid="confirm-cancel">
            {cancelLabel}
          </button>
          <button type="button" className="button button-danger" onClick={onConfirm} data-testid="confirm-accept">
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
