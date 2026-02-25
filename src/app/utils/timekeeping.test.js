import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleMapsUrl,
  getLatestTimeOutEntry,
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
