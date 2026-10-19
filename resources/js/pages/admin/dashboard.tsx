import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';

const currency = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

type Stats = {
    users_count: number;
    month_entry_count: number;
    month_minutes: number;
    month_earnings_cents: number;
    active_clocks_count: number;
};

type RecentEntry = {
    id: number;
    user_id: number;
    user_name: string;
    baan_name: string;
    work_date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    earnings_cents: number;
};

function formatMonthLabel(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);

    return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(new Date(year, monthNumber - 1, 1));
}

function formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);

    return dateFormat.format(new Date(year, month - 1, day));
}

function formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}m`;
}

export default function AdminDashboard({
    month,
    stats,
    recent_entries,
}: {
    month: string;
    stats: Stats;
    recent_entries: RecentEntry[];
}) {
    const monthLabel = formatMonthLabel(month);

    return (
        <AdminLayout title="Admin">
            <div className="space-y-8">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight">Overzicht</h1>
                    <p className="text-muted-foreground text-sm">Platformcijfers voor {monthLabel}.</p>
                </header>

                <section aria-label="Samenvatting" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {[
                        { label: 'Gebruikers', value: String(stats.users_count) },
                        { label: 'Registraties', value: String(stats.month_entry_count) },
                        { label: 'Gewerkt', value: formatDuration(stats.month_minutes) },
                        { label: 'Verdiensten', value: currency.format(stats.month_earnings_cents / 100) },
                        { label: 'Actieve klokken', value: String(stats.active_clocks_count) },
                    ].map((item) => (
                        <div key={item.label} className="border-border space-y-1 rounded-xl border px-4 py-3">
                            <p className="text-muted-foreground text-sm">{item.label}</p>
                            <p className="text-xl font-semibold tabular-nums">{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="space-y-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight">Recente uren</h2>
                    <div className="bg-card overflow-hidden rounded-xl border">
                        <Table aria-label="Recente uren op het platform">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Datum</TableHead>
                                    <TableHead>Gebruiker</TableHead>
                                    <TableHead>Baan</TableHead>
                                    <TableHead>Tijd</TableHead>
                                    <TableHead className="text-right">Gewerkt</TableHead>
                                    <TableHead className="text-right">Verdiensten</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recent_entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-muted-foreground h-20 text-center">
                                            Nog geen urenregistraties.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    recent_entries.map((entry) => (
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
                                            </TableCell>
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
                </section>
            </div>
        </AdminLayout>
    );
}
