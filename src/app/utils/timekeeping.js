export function buildGoogleMapsUrl(location) {
  if (!location || typeof location !== 'object') return null;

  const { lat, lng, address } = location;
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
  if (hasCoordinates) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  if (typeof address === 'string' && address.trim().length > 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
  }

  return null;
}

export function getLatestTimeOutEntry(timeOutEntries) {
  if (!Array.isArray(timeOutEntries) || timeOutEntries.length === 0) {
    return null;
  }

  const entriesWithDate = timeOutEntries.filter(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      typeof entry.timestamp === 'string' &&
      Number.isFinite(new Date(entry.timestamp).getTime())
  );

  if (entriesWithDate.length === 0) {
    return timeOutEntries[timeOutEntries.length - 1] ?? null;
  }

  return entriesWithDate.reduce((latest, current) => {
    const latestTime = new Date(latest.timestamp).getTime();
    const currentTime = new Date(current.timestamp).getTime();
    return currentTime > latestTime ? current : latest;
  });
}

export function sortBreakdownRows(rows) {
  if (!Array.isArray(rows)) return [];
  return [...rows].sort((a, b) => {
    const valueDelta = (Number(b.value) || 0) - (Number(a.value) || 0);
    if (valueDelta !== 0) return valueDelta;
    return String(a.userName || '').localeCompare(String(b.userName || ''));
  });
}

export function sumBreakdownValues(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((sum, row) => sum + (Number(row.value) || 0), 0);
}
