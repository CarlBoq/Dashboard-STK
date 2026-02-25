import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleMapsUrl,
  getLatestTimeOutEntry,
  getPresetRange,
  isDateInRange,
  normalizeRange,
  sortBreakdownRows,
  sumBreakdownValues,
} from './timekeeping.js';

test('buildGoogleMapsUrl prefers coordinates when both coordinates and address exist', () => {
  const url = buildGoogleMapsUrl({
    lat: 14.5995,
    lng: 120.9842,
    address: 'Manila City Hall',
  });

  assert.equal(url, 'https://www.google.com/maps?q=14.5995,120.9842');
});

test('buildGoogleMapsUrl falls back to encoded address when no coordinates exist', () => {
  const url = buildGoogleMapsUrl({
    address: '123 Main Street, Downtown District',
  });

  assert.equal(
    url,
    'https://www.google.com/maps/search/?api=1&query=123%20Main%20Street%2C%20Downtown%20District'
  );
});

test('buildGoogleMapsUrl returns null when no usable location exists', () => {
  const url = buildGoogleMapsUrl({});
  assert.equal(url, null);
});

test('getLatestTimeOutEntry returns the newest entry by timestamp', () => {
  const entry = getLatestTimeOutEntry([
    { timestamp: '2026-02-12T16:10:00', lat: 40.71, lng: -74.0 },
    { timestamp: '2026-02-12T18:15:00', address: '88 Ridge Avenue' },
    { timestamp: '2026-02-12T17:03:00', lat: 40.72, lng: -74.01 },
  ]);

  assert.deepEqual(entry, { timestamp: '2026-02-12T18:15:00', address: '88 Ridge Avenue' });
});

test('sortBreakdownRows sorts by value descending and then by userName', () => {
  const sorted = sortBreakdownRows([
    { userName: 'Mila', value: 1 },
    { userName: 'Anna', value: 3 },
    { userName: 'Ben', value: 3 },
  ]);

  assert.deepEqual(sorted, [
    { userName: 'Anna', value: 3 },
    { userName: 'Ben', value: 3 },
    { userName: 'Mila', value: 1 },
  ]);
});

test('sumBreakdownValues returns the aggregated KPI total', () => {
  const total = sumBreakdownValues([
    { userName: 'A', value: 1 },
    { userName: 'B', value: 1 },
    { userName: 'C', value: 1 },
  ]);

  assert.equal(total, 3);
});

test('getPresetRange returns a 7-day inclusive range for this-week', () => {
  const range = getPresetRange('this-week', '2026-02-12');
  assert.deepEqual(range, { start: '2026-02-06', end: '2026-02-12' });
});

test('getPresetRange returns a 14-day inclusive range for this-2-weeks', () => {
  const range = getPresetRange('this-2-weeks', '2026-02-12');
  assert.deepEqual(range, { start: '2026-01-30', end: '2026-02-12' });
});

test('normalizeRange swaps custom range dates when start is after end', () => {
  const normalized = normalizeRange('2026-02-12', '2026-02-01');
  assert.deepEqual(normalized, { start: '2026-02-01', end: '2026-02-12' });
});

test('isDateInRange checks if a date is inside the normalized range', () => {
  assert.equal(isDateInRange('2026-02-10', '2026-02-01', '2026-02-12'), true);
  assert.equal(isDateInRange('2026-02-13', '2026-02-01', '2026-02-12'), false);
});
