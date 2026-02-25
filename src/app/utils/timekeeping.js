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

function toDateObject(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function formatDateObject(dateObject) {
  const year = dateObject.getFullYear();
  const month = `${dateObject.getMonth() + 1}`.padStart(2, '0');
  const day = `${dateObject.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function minusDays(dateObject, days) {
  const copy = new Date(dateObject);
  copy.setDate(copy.getDate() - days);
  return copy;
}

export function getPresetRange(preset, anchorDateStr) {
  const anchorDate = toDateObject(anchorDateStr);
  if (!anchorDate) return { start: '', end: '' };

  const end = formatDateObject(anchorDate);

  switch (preset) {
    case 'today':
      return { start: end, end };
    case 'this-week':
      return { start: formatDateObject(minusDays(anchorDate, 6)), end };
    case 'this-2-weeks':
      return { start: formatDateObject(minusDays(anchorDate, 13)), end };
    case 'this-month':
      return {
        start: formatDateObject(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)),
        end,
      };
    default:
      return { start: '', end: '' };
  }
}

export function normalizeRange(start, end) {
  if (!start || !end) return { start: '', end: '' };
  return start <= end ? { start, end } : { start: end, end: start };
}

export function isDateInRange(dateStr, start, end) {
  if (!dateStr || !start || !end) return false;
  return dateStr >= start && dateStr <= end;
}
