import type { HourEntry } from '@/types/hour-entry';

function csvEscape(value: string): string {
    if (/[",\n\r]/.test(value)) {
        return `"${value.replaceAll('"', '""')}"`;
    }

    return value;
}

function formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

function formatEarnings(cents: number): string {
    return (cents / 100).toFixed(2).replace('.', ',');
}

export function hourEntriesToCsv(entries: HourEntry[]): string {
    const header = ['Datum', 'Baan', 'Begin', 'Einde', 'Pauze (min)', 'Gewerkt', 'Verdiensten (EUR)', 'Notitie'];
    const rows = entries.map((entry) => [
        entry.work_date,
        entry.baan_name,
        entry.start_time,
        entry.end_time,
        String(entry.break_minutes),
        formatDuration(entry.duration_minutes),
        formatEarnings(entry.earnings_cents),
        entry.note ?? '',
    ]);

    return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

export function downloadHourEntriesCsv(entries: HourEntry[], filename = 'shiftly-uren.csv'): void {
    const csv = hourEntriesToCsv(entries);
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
