import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { filterAdminHourEntries, type AdminHourEntryRow, type AdminHourFilters } from '@/lib/admin-hour-filters';
import { Link } from '@inertiajs/react';
import { useId, useMemo, useState } from 'react';

const currency = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

function formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);

    return dateFormat.format(new Date(year, month - 1, day));
}

function formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}m`;
}

export default function AdminUrenIndex({
    entries,
    users,
}: {
    entries: AdminHourEntryRow[];
    users: { id: number; name: string }[];
}) {
    const fieldId = useId();
    const [filters, setFilters] = useState<AdminHourFilters>({ userId: '', dateFrom: '', dateTo: '', search: '' });
    const { entries: filteredEntries, totalMinutes, totalEarningsCents, invalidRange } = useMemo(
        () => filterAdminHourEntries(entries, filters),
        [entries, filters],
    );
    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <AdminLayout title="Uren">
            <div className="space-y-6">
                <header>
                    <h1 className="font-display text-3xl font-semibold tracking-tight">Uren</h1>
                </header>

                <div className="space-y-3">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`${fieldId}-user`}>Gebruiker</Label>
                            <select
                                id={`${fieldId}-user`}
                                value={filters.userId}
                                onChange={(event) => setFilters({ ...filters, userId: event.target.value })}
                                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                            >
                                <option value="">Alle gebruikers</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`${fieldId}-search`}>Zoeken</Label>
                            <Input
                                id={`${fieldId}-search`}
                                value={filters.search}
                                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                                placeholder="Naam, baan, bedrijf of notitie..."
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm">
                            <span className="font-semibold tabular-nums">{filteredEntries.length}</span>
                            <span className="text-muted-foreground">
                                {' '}
                                van {entries.length} {entries.length === 1 ? 'registratie' : 'registraties'}
                            </span>
                            {!invalidRange && filteredEntries.length > 0 && (
                                <span className="text-muted-foreground">
                                    {' '}
                                    · {formatDuration(totalMinutes)} · {currency.format(totalEarningsCents / 100)}
                                </span>
                            )}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!hasFilters}
                            onClick={() => setFilters({ userId: '', dateFrom: '', dateTo: '', search: '' })}
                        >
                            Filters wissen
                        </Button>
                    </div>
                    {invalidRange && (
                        <p role="alert" className="text-destructive text-sm">
                            “Vanaf” mag niet na “Tot en met” liggen.
                        </p>
                    )}
                </div>

                <div className="bg-card overflow-hidden rounded-xl border">
                    <Table aria-label="Alle uren">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Datum</TableHead>
                                <TableHead>Gebruiker</TableHead>
                                <TableHead>Baan</TableHead>
                                <TableHead>Bedrijf</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tijd</TableHead>
                                <TableHead className="text-right">Gewerkt</TableHead>
                                <TableHead className="text-right">Verdiensten</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEntries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-muted-foreground h-24 text-center">
                                        {entries.length === 0
                                            ? 'Nog geen urenregistraties.'
                                            : invalidRange
                                              ? 'Geen registraties in dit bereik.'
                                              : 'Geen registraties gevonden.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEntries.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="tabular-nums">{formatDate(entry.work_date)}</TableCell>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={route('admin.users.show', entry.user_id)}
                                                className="underline underline-offset-4"
                                            >
                                                {entry.user_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="max-w-xs [overflow-wrap:anywhere] whitespace-normal">
                                            {entry.baan_name}
                                            {entry.note && (
                                                <span className="text-muted-foreground mt-0.5 block text-xs [overflow-wrap:anywhere]">
                                                    {entry.note}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-xs [overflow-wrap:anywhere] whitespace-normal">
                                            {entry.company_name ? (
                                                entry.company_name
                                            ) : (
                                                <span className="text-muted-foreground">Persoonlijk</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{entry.approval_status_label}</TableCell>
                                        <TableCell className="tabular-nums">
                                            {entry.start_time}–{entry.end_time}
                                            {entry.end_time < entry.start_time && (
                                                <span className="text-muted-foreground ml-1 text-xs">(+1 dag)</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatDuration(entry.duration_minutes)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">
                                            {currency.format(entry.earnings_cents / 100)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
}
