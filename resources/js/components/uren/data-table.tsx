import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DeleteHourEntryDialog from '@/components/uren/delete-hour-entry-dialog';
import HourEntryDialog from '@/components/uren/hour-entry-dialog';
import { type Baan } from '@/types/baan';
import { type HourEntry } from '@/types/hour-entry';
import {
    columnFilteringFeature,
    createColumnHelper,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    filterFn_includesString,
    rowPaginationFeature,
    rowSortingFeature,
    sortFn_basic,
    sortFn_text,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
const features = tableFeatures({
    columnFilteringFeature,
    rowSortingFeature,
    rowPaginationFeature,
    filteredRowModel: createFilteredRowModel(),
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    filterFns: { includesString: filterFn_includesString },
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
        filterFn: 'includesString',
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
]);

export default function HoursDataTable({ entries, banen, today }: { entries: HourEntry[]; banen: Baan[]; today: string }) {
    const table = useTable({ features, data: entries, columns, getRowId: (entry) => String(entry.id) });
    return (
        <div className="space-y-4">
            <Input
                aria-label="Zoek op baan"
                placeholder="Zoek op baan..."
                className="max-w-sm"
                value={(table.getColumn('baan_name')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('baan_name')?.setFilterValue(event.target.value)}
            />
            <div className="bg-card overflow-hidden rounded-xl border">
                <Table aria-label="Mijn uren" className="min-w-[51rem] table-fixed">
                    <colgroup>
                        <col className="w-32" />
                        <col />
                        <col className="w-24" />
                        <col className="w-32" />
                        <col className="w-24" />
                        <col className="w-28" />
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
                                    {entries.length ? 'Geen registraties gevonden.' : 'Je hebt nog geen uren geregistreerd.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {table.getPageCount() > 1 && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
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
        </div>
    );
}
