import assert from 'node:assert/strict';
import test from 'node:test';
import { filterAdminHourEntries } from '../../resources/js/lib/admin-hour-filters.ts';

const all = { userId: '', dateFrom: '', dateTo: '', search: '' };
const entry = (id, user_id, user_name, baan_name, work_date, duration_minutes, earnings_cents = 0, note = null) => ({
    id,
    user_id,
    user_name,
    baan_name,
    work_date,
    duration_minutes,
    earnings_cents,
    note,
    start_time: '09:00',
    end_time: '17:00',
});
const entries = [
    entry(1, 1, 'Sara Bakker', 'Winkel', '2026-10-18', 450, 11625),
    entry(2, 1, 'Sara Bakker', 'Horeca', '2026-10-19', 300, 9000, 'Avonddienst'),
    entry(3, 2, 'Tom Jansen', 'Zorg', '2026-10-19', 450, 16500),
];

test('date boundaries are inclusive and totals use the same selection', () => {
    const result = filterAdminHourEntries(entries, { ...all, dateFrom: '2026-10-19', dateTo: '2026-10-19' });
    assert.deepEqual(result.entries.map((row) => row.id), [2, 3]);
    assert.equal(result.totalMinutes, 750);
    assert.equal(result.totalEarningsCents, 25500);
});

test('user filter narrows the list', () => {
    const result = filterAdminHourEntries(entries, { ...all, userId: '1' });
    assert.deepEqual(result.entries.map((row) => row.id), [1, 2]);
});

test('search matches user, job and note without case sensitivity', () => {
    assert.deepEqual(
        filterAdminHourEntries(entries, { ...all, search: '  TOM  ' }).entries.map((row) => row.id),
        [3],
    );
    assert.deepEqual(
        filterAdminHourEntries(entries, { ...all, search: 'winkel' }).entries.map((row) => row.id),
        [1],
    );
    assert.deepEqual(
        filterAdminHourEntries(entries, { ...all, search: 'avond' }).entries.map((row) => row.id),
        [2],
    );
});

test('invalid ranges return no rows', () => {
    const result = filterAdminHourEntries(entries, { ...all, dateFrom: '2026-10-20', dateTo: '2026-10-18' });
    assert.deepEqual(result.entries, []);
    assert.equal(result.invalidRange, true);
});
