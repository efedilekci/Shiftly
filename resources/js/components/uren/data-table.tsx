import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DeleteHourEntryDialog from '@/components/uren/delete-hour-entry-dialog';
import HourEntryDialog from '@/components/uren/hour-entry-dialog';
import { downloadHourEntriesCsv } from '@/lib/hour-entry-csv';
import { filterHourEntries, type HourFilters } from '@/lib/hour-entry-filters';
import { type Baan } from '@/types/baan';
import { type HourEntry } from '@/types/hour-entry';
import {
    createColumnHelper,
    createPaginatedRowModel,
    createSortedRowModel,
    rowPaginationFeature,
    rowSortingFeature,
    sortFn_basic,
    sortFn_text,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from 'lucide-react';
import { useId, useMemo, useState } from 'react';

const currency = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
const features = tableFeatures({
    rowSortingFeature,
    rowPaginationFeature,
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    sortFns: { basic: sortFn_basic, text: sortFn_text },
});
const helper = createColumnHelper<typeof features, HourEntry>();
const columns = helper.columns([
    helper.accessor('work_date', {
        header: 'Datum',
        sortFn: 'text',
        cell: ({ getValue }) => {
            const [year, month, day] = getValue().split('-').map(Number);
            return dateFormat.format(new Date(year, month - 1, day));
        },
    }),
    helper.accessor('baan_name', {
        header: 'Baan',
        sortFn: 'text',
        cell: ({ getValue }) => <span className="block max-w-xs min-w-28 [overflow-wrap:anywhere] whitespace-normal">{getValue()}</span>,
    }),
    helper.accessor('start_time', { header: 'Begin', sortFn: 'text' }),
    helper.accessor('end_time', {
        header: 'Einde',
        sortFn: 'text',
        cell: ({ row, getValue }) => (
            <span>
                {getValue()}
                {getValue() < row.original.start_time && <span className="text-muted-foreground ml-1 text-xs">(+1 dag)</span>}
            </span>
        ),
    }),
    helper.accessor('break_minutes', { header: 'Pauze', sortFn: 'basic', cell: ({ getValue }) => `${getValue()} min` }),
    helper.accessor('duration_minutes', {
        header: 'Gewerkt',
        sortFn: 'basic',
        cell: ({ getValue }) => (
            <span className="font-medium tabular-nums">
                {Math.floor(getValue() / 60)}u {String(getValue() % 60).padStart(2, '0')}m
            </span>
        ),
    }),
    helper.accessor('earnings_cents', {
        header: 'Verdiensten',
        sortFn: 'basic',
        cell: ({ getValue }) => <span className="font-medium tabular-nums">{currency.format(getValue() / 100)}</span>,
    }),
    helper.accessor('note', {
        header: 'Notitie',
        enableSorting: false,
        cell: ({ getValue }) => {
            const note = getValue();
            if (!note) return <span className="text-muted-foreground">—</span>;

            return <span className="block max-w-48 [overflow-wrap:anywhere] whitespace-normal">{note}</span>;
        },
    }),
]);

export default function HoursDataTable({ entries, banen, today }: { entries: HourEntry[]; banen: Baan[]; today: string }) {
    const fieldId = useId();
    const [filters, setFilters] = useState<HourFilters>({ baanId: '', dateFrom: '', dateTo: '', search: '' });
    const {
        entries: filteredEntries,
        totalMinutes,
        totalEarningsCents,
        invalidRange,
    } = useMemo(() => filterHourEntries(entries, filters), [entries, filters]);
    const hasFilters = Object.values(filters).some(Boolean);
    const table = useTable({ features, data: filteredEntries, columns, getRowId: (entry) => String(entry.id) });
    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="grid gap-2">
                        <Label htmlFor={`${fieldId}-from`}>Vanaf</Label>
                        <Input
                            id={`${fieldId}-from`}
                            type="date"
                            value={filters.dateFrom}
                            onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${fieldId}-to`}>Tot en met</Label>
                        <Input
                            id={`${fieldId}-to`}
                            type="date"
                            value={filters.dateTo}
                            onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })}
                            aria-invalid={invalidRange}
                            aria-describedby={invalidRange ? `${fieldId}-range-error` : undefined}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${fieldId}-job`}>Baan</Label>
                        <select
                            id={`${fieldId}-job`}
                            value={filters.baanId}
                            onChange={(event) => setFilters({ ...filters, baanId: event.target.value })}
                            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                        >
                            <option value="">Alle banen</option>
                            {banen.map((baan) => (
                                <option key={baan.id} value={baan.id}>
                                    {baan.name}
                                </option>
                            ))}
                            {entries.some((entry) => entry.baan_id === null) && <option value="deleted">Verwijderde banen</option>}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${fieldId}-search`}>Zoeken</Label>
                        <Input
                            id={`${fieldId}-search`}
                            placeholder="Zoek op baan of notitie..."
                            value={filters.search}
                            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {!invalidRange && (
                        <p className="text-sm" role="status">
                            Totaal:{' '}
                            <span className="font-semibold tabular-nums">
                                {Math.floor(totalMinutes / 60)}u {String(totalMinutes % 60).padStart(2, '0')}m
                            </span>
                            <span className="ml-3 inline-block">
                                Verdiensten: <span className="font-semibold tabular-nums">{currency.format(totalEarningsCents / 100)}</span>
                            </span>
                            <span className="text-muted-foreground ml-3 inline-block">
                                {filteredEntries.length} {filteredEntries.length === 1 ? 'registratie' : 'registraties'}
                            </span>
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={invalidRange || filteredEntries.length === 0}
                            onClick={() => downloadHourEntriesCsv(filteredEntries)}
                        >
                            <Download className="size-4" aria-hidden />
                            Exporteer CSV
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!hasFilters}
                            onClick={() => setFilters({ baanId: '', dateFrom: '', dateTo: '', search: '' })}
                        >
                            Filters wissen
                        </Button>
                    </div>
                </div>
                {invalidRange && (
                    <p id={`${fieldId}-range-error`} role="alert" className="text-destructive text-sm">
                        De einddatum moet op of na de begindatum liggen.
                    </p>
                )}
            </div>
            {!invalidRange && (
                <>
                    <div className="bg-card overflow-hidden rounded-xl border">
                        <Table aria-label="Mijn uren" className="min-w-[59rem] table-fixed">
                            <colgroup>
                                <col className="w-32" />
                                <col />
                                <col className="w-24" />
                                <col className="w-32" />
                                <col className="w-24" />
                                <col className="w-28" />
                                <col className="w-32" />
                                <col className="w-40" />
                                <col className="w-28" />
                            </colgroup>
                            <TableHeader>
                                {table.getHeaderGroups().map((group) => (
                                    <TableRow key={group.id}>
                                        {group.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                scope="col"
                                                aria-sort={
                                                    header.column.getIsSorted() === 'asc'
                                                        ? 'ascending'
                                                        : header.column.getIsSorted() === 'desc'
                                                          ? 'descending'
                                                          : 'none'
                                                }
                                            >
                                                <Button type="button" variant="ghost" size="sm" onClick={header.column.getToggleSortingHandler()}>
                                                    <table.FlexRender header={header} />
                                                    {header.column.getIsSorted() === 'asc' ? (
                                                        <ArrowUp aria-hidden="true" />
                                                    ) : header.column.getIsSorted() === 'desc' ? (
                                                        <ArrowDown aria-hidden="true" />
                                                    ) : (
                                                        <ArrowUpDown aria-hidden="true" />
                                                    )}
                                                </Button>
                                            </TableHead>
                                        ))}
                                        <TableHead scope="col">
                                            <span className="sr-only">Acties</span>
                                        </TableHead>
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getAllCells().map((cell) => (
                                                <TableCell key={cell.id} className="px-5 py-4">
                                                    <table.FlexRender cell={cell} />
                                                </TableCell>
                                            ))}
                                            <TableCell className="px-3 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <HourEntryDialog entry={row.original} banen={banen} today={today} />
                                                    <DeleteHourEntryDialog entry={row.original} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length + 1} className="text-muted-foreground h-24 text-center">
                                            {entries.length || hasFilters ? 'Geen registraties gevonden.' : 'Je hebt nog geen uren geregistreerd.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {table.getPageCount() > 1 && (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!table.getCanPreviousPage()}
                                onClick={() => table.previousPage()}
                            >
                                Vorige
                            </Button>
                            <span className="text-muted-foreground text-sm">
                                Pagina {table.state.pagination.pageIndex + 1} van {table.getPageCount()}
                            </span>
                            <Button type="button" variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                                Volgende
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
