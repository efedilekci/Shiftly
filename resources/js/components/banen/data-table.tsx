import BaanDialog from '@/components/banen/baan-dialog';
import DeleteBaanDialog from '@/components/banen/delete-baan-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Baan } from '@/types/baan';
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

const currency = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const features = tableFeatures({
    columnFilteringFeature,
    rowSortingFeature,
    rowPaginationFeature,
    filteredRowModel: createFilteredRowModel(),
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    filterFns: { includesString: filterFn_includesString },
    sortFns: { text: sortFn_text, basic: sortFn_basic },
});
const columnHelper = createColumnHelper<typeof features, Baan>();
const columns = columnHelper.columns([
    columnHelper.accessor('name', {
        header: 'Baan',
        filterFn: 'includesString',
        sortFn: 'text',
        cell: ({ getValue }) => <span className="block max-w-xs font-medium [overflow-wrap:anywhere] whitespace-normal">{getValue()}</span>,
    }),
    columnHelper.accessor((baan) => Number(baan.hourly_wage), {
        id: 'hourly_wage',
        header: 'Uurloon',
        sortFn: 'basic',
        cell: ({ getValue }) => <span className="tabular-nums">{currency.format(getValue())}</span>,
    }),
    columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Acties</span>,
        enableSorting: false,
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-1">
                <BaanDialog baan={row.original} />
                <DeleteBaanDialog baan={row.original} />
            </div>
        ),
    }),
]);

export default function BanenDataTable({ banen }: { banen: Baan[] }) {
    const table = useTable({ features, data: banen, columns, getRowId: (baan) => String(baan.id) });

    return (
        <div className="space-y-4">
            <Input
                aria-label="Zoek een baan"
                placeholder="Zoek een baan..."
                className="max-w-sm"
                value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            />
            <div className="bg-card overflow-hidden rounded-xl border">
                <Table aria-label="Mijn banen" className="min-w-[26rem] table-fixed">
                    <colgroup>
                        <col />
                        <col className="w-28 sm:w-36" />
                        <col className="w-28" />
                    </colgroup>
                    <TableHeader>
                        {table.getHeaderGroups().map((group) => (
                            <TableRow key={group.id}>
                                {group.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        scope="col"
                                        className={header.column.id === 'hourly_wage' ? 'text-right' : ''}
                                        aria-sort={
                                            !header.column.getCanSort()
                                                ? undefined
                                                : header.column.getIsSorted() === 'asc'
                                                  ? 'ascending'
                                                  : header.column.getIsSorted() === 'desc'
                                                    ? 'descending'
                                                    : 'none'
                                        }
                                    >
                                        {header.column.getCanSort() ? (
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
                                        ) : (
                                            <table.FlexRender header={header} />
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getAllCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={
                                                cell.column.id === 'actions'
                                                    ? 'px-3 py-4 text-right'
                                                    : cell.column.id === 'hourly_wage'
                                                      ? 'px-5 py-4 text-right'
                                                      : 'px-5 py-4'
                                            }
                                        >
                                            <table.FlexRender cell={cell} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                                    {banen.length ? 'Geen banen gevonden.' : 'Je hebt nog geen banen toegevoegd.'}
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
