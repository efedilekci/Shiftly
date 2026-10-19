import type { HourEntry } from '@/types/hour-entry';

export type HourFilters = {
    baanId: string;
    dateFrom: string;
    dateTo: string;
    search: string;
};

export function filterHourEntries(entries: HourEntry[], filters: HourFilters) {
    const invalidRange = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
    const search = filters.search.trim().toLocaleLowerCase('nl-NL');
    const filtered = invalidRange
        ? []
        : entries.filter((entry) => {
              if (filters.dateFrom && entry.work_date < filters.dateFrom) return false;
              if (filters.dateTo && entry.work_date > filters.dateTo) return false;
              if (filters.baanId === 'deleted' && entry.baan_id !== null) return false;
              if (filters.baanId && filters.baanId !== 'deleted' && String(entry.baan_id) !== filters.baanId) return false;
              return !search || entry.baan_name.toLocaleLowerCase('nl-NL').includes(search);
          });

    return {
        entries: filtered,
        totalMinutes: filtered.reduce((total, entry) => total + entry.duration_minutes, 0),
        invalidRange,
    };
}
