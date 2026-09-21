import React from 'react';

const StatusNotice = ({ notice, onDismiss }) => {
  if (!notice?.message) return null;

  const type = notice.type === 'success' ? 'success' : 'error';

  return (
    <div className={`app-notice app-notice-${type}`} role="status">
      <span>{notice.message}</span>
      {onDismiss && (
        <button type="button" className="app-notice-dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
};

export default StatusNotice;
