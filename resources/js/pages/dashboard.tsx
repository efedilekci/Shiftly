import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];
const currency = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

function formatMonthLabel(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);

    return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(new Date(year, monthNumber - 1, 1));
}

function formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}m`;
}

type MonthBreakdownRow = {
    baan_name: string;
    entry_count: number;
    minutes: number;
    earnings_cents: number;
};

type DashboardProps = {
    month: string;
    month_entry_count: number;
    month_minutes: number;
    month_earnings_cents: number;
    month_breakdown: MonthBreakdownRow[];
};

export default function Dashboard({
    month,
    month_entry_count,
    month_minutes,
    month_earnings_cents,
    month_breakdown,
}: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const monthLabel = formatMonthLabel(month);

    const stats = [
        { label: 'Gewerkt', value: formatDuration(month_minutes) },
        { label: 'Verdiensten', value: currency.format(month_earnings_cents / 100) },
        { label: 'Registraties', value: String(month_entry_count) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:p-10">
                <header className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welkom, {auth.user.name}.</h1>
                    <p className="text-muted-foreground text-sm">Overzicht van {monthLabel}</p>
                </header>

                <section aria-label={`Maandtotalen ${monthLabel}`} className="grid gap-4 sm:grid-cols-3">
                    {stats.map((stat) => (
                        <Card key={stat.label}>
                            <CardHeader>
                                <CardDescription>{stat.label}</CardDescription>
                                <CardTitle className="text-2xl tabular-nums">{stat.value}</CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Per baan</CardTitle>
                        <CardDescription>Verdeling van {monthLabel}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {month_breakdown.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Nog geen uren deze maand.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Baan</TableHead>
                                        <TableHead className="text-right">Registraties</TableHead>
                                        <TableHead className="text-right">Gewerkt</TableHead>
                                        <TableHead className="text-right">Verdiensten</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {month_breakdown.map((row) => (
                                        <TableRow key={row.baan_name}>
                                            <TableCell className="max-w-xs font-medium [overflow-wrap:anywhere] whitespace-normal">
                                                {row.baan_name}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{row.entry_count}</TableCell>
                                            <TableCell className="text-right tabular-nums">{formatDuration(row.minutes)}</TableCell>
                                            <TableCell className="text-right font-medium tabular-nums">
                                                {currency.format(row.earnings_cents / 100)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
