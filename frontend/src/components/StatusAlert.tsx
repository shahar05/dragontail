interface StatusAlertProps {
  error: string;
  onClose: () => void;
}

function StatusAlert({ error, onClose }: StatusAlertProps) {
  return (
    <div className="alert alert-error">
      <span>⚠️ {error}</span>
      <button type="button" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}

export default StatusAlert;
