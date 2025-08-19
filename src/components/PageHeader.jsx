import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <div style={{ color: "var(--muted)", marginTop: 4 }}>{subtitle}</div>}
      </div>
      <div>{actions}</div>
    </div>
  );
}


