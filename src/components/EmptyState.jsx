import React from "react";

export default function EmptyState({ icon = "bi-inboxes", title, subtitle, action }) {
  return (
    <div className="empty">
      <i className={`bi ${icon}`} />
      <div style={{ fontWeight: 600 }}>{title}</div>
      {subtitle && <div style={{ marginTop: 6 }}>{subtitle}</div>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}


