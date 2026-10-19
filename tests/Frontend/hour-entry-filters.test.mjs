import assert from 'node:assert/strict';
import test from 'node:test';
import { filterHourEntries } from '../../resources/js/lib/hour-entry-filters.ts';

const all = { baanId: '', dateFrom: '', dateTo: '', search: '' };
const entry = (id, baan_id, baan_name, work_date, duration_minutes) => ({
    id, baan_id, baan_name, work_date, duration_minutes,
    start_time: '09:00', end_time: '17:00', break_minutes: 30,
});
const entries = [
    entry(1, 1, 'Winkel', '2026-10-18', 450),
    entry(2, 1, 'Winkel', '2026-10-19', 465),
    entry(3, 2, 'Bakkerij', '2026-10-19', 300),
    entry(4, 1, 'Oude winkelnaam', '2026-10-20', 120),
    entry(5, null, 'Verwijderde baan', '2026-10-21', 60),
];

test('date boundaries are inclusive and the total uses the same selection', () => {
    const result = filterHourEntries(entries, { ...all, dateFrom: '2026-10-19', dateTo: '2026-10-20' });
    assert.deepEqual(result.entries.map((row) => row.id), [2, 3, 4]);
    assert.equal(result.totalMinutes, 885);
});

test('a job filter uses its ID, including hours saved under an older job name', () => {
    const result = filterHourEntries(entries, { ...all, baanId: '1', dateFrom: '2026-10-19' });
    assert.deepEqual(result.entries.map((row) => row.id), [2, 4]);
    assert.equal(result.totalMinutes, 585);
});

test('search combines with period and job filters without case sensitivity', () => {
    const result = filterHourEntries(entries, { ...all, baanId: '1', dateFrom: '2026-10-19', search: '  WINKEL  ' });
    assert.deepEqual(result.entries.map((row) => row.id), [2, 4]);
    assert.equal(result.totalMinutes, 585);
});

test('single-ended periods and deleted jobs can be selected', () => {
    assert.deepEqual(filterHourEntries(entries, { ...all, dateTo: '2026-10-18' }).entries.map((row) => row.id), [1]);
    const deleted = filterHourEntries(entries, { ...all, baanId: 'deleted' });
    assert.deepEqual(deleted.entries.map((row) => row.id), [5]);
    assert.equal(deleted.totalMinutes, 60);
});

test('an inverted range is reported and does not produce a misleading total', () => {
    const result = filterHourEntries(entries, { ...all, dateFrom: '2026-10-20', dateTo: '2026-10-19' });
    assert.equal(result.invalidRange, true);
    assert.deepEqual(result.entries, []);
});

test('an empty selection has zero minutes and clearing filters restores everything', () => {
    assert.equal(filterHourEntries(entries, { ...all, baanId: '999' }).totalMinutes, 0);
    const result = filterHourEntries(entries, all);
    assert.deepEqual(result.entries, entries);
    assert.equal(result.totalMinutes, 1395);
});

test('totals include matches beyond the first table page', () => {
    const manyEntries = Array.from({ length: 15 }, (_, index) => entry(index + 1, 1, 'Winkel', '2026-10-19', 61));
    const result = filterHourEntries(manyEntries, { ...all, baanId: '1' });
    assert.equal(result.entries.length, 15);
    assert.equal(result.totalMinutes, 915);
});
