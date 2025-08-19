import React from "react";

export default function CardPanel({ className = "", children }) {
  return <div className={`card-surface p-3 ${className}`}>{children}</div>;
}

