/** Convierte fecha/hora local a ISO "Z" preservando la hora local. */
export function toIsoPreservingLocal(dateStr /* yyyy-mm-dd */, timeStr = "00:00") {
  const local = new Date(`${dateStr}T${timeStr}:00`);
  const fixed = new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  return fixed.toISOString();
}

