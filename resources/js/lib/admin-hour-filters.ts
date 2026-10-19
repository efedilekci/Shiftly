export type AdminHourEntryRow = {
    id: number;
    user_id: number;
    user_name: string;
    baan_name: string;
    work_date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    earnings_cents: number;
    note: string | null;
};

export type AdminHourFilters = {
    userId: string;
    dateFrom: string;
    dateTo: string;
    search: string;
};

export function filterAdminHourEntries(entries: AdminHourEntryRow[], filters: AdminHourFilters) {
    const invalidRange = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
    const search = filters.search.trim().toLocaleLowerCase('nl-NL');
    const filtered = invalidRange
        ? []
        : entries.filter((entry) => {
              if (filters.userId && String(entry.user_id) !== filters.userId) return false;
              if (filters.dateFrom && entry.work_date < filters.dateFrom) return false;
              if (filters.dateTo && entry.work_date > filters.dateTo) return false;
              if (!search) return true;

              return (
                  entry.user_name.toLocaleLowerCase('nl-NL').includes(search) ||
                  entry.baan_name.toLocaleLowerCase('nl-NL').includes(search) ||
                  (entry.note?.toLocaleLowerCase('nl-NL').includes(search) ?? false)
              );
          });

    return {
        entries: filtered,
        totalMinutes: filtered.reduce((total, entry) => total + entry.duration_minutes, 0),
        totalEarningsCents: filtered.reduce((total, entry) => total + entry.earnings_cents, 0),
        invalidRange,
    };
}
