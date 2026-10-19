import assert from 'node:assert/strict';
import test from 'node:test';
import { hourEntriesToCsv } from '../../resources/js/lib/hour-entry-csv.ts';

const entry = {
    id: 1,
    baan_id: 1,
    baan_name: 'Winkel, avond',
    work_date: '2026-10-19',
    start_time: '22:00',
    end_time: '06:00',
    break_minutes: 30,
    duration_minutes: 450,
    earnings_cents: 11625,
};

test('csv includes a header and escaped job names', () => {
    const csv = hourEntriesToCsv([entry]);
    const lines = csv.split('\r\n');

    assert.equal(lines[0], 'Datum,Baan,Begin,Einde,Pauze (min),Gewerkt,Verdiensten (EUR)');
    assert.equal(lines[1], '2026-10-19,"Winkel, avond",22:00,06:00,30,7:30,"116,25"');
});

test('csv stays empty of data rows when there are no entries', () => {
    assert.equal(hourEntriesToCsv([]), 'Datum,Baan,Begin,Einde,Pauze (min),Gewerkt,Verdiensten (EUR)');
});
