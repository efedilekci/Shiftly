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

function formatShortMonth(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);

    return new Intl.DateTimeFormat('nl-NL', { month: 'short' }).format(new Date(year, monthNumber - 1, 1));
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

type HoursChartPoint = {
    month: string;
    minutes: number;
    hours: number;
    percent: number;
};

type DashboardProps = {
    month: string;
    month_entry_count: number;
    month_minutes: number;
    month_earnings_cents: number;
    month_breakdown: MonthBreakdownRow[];
    hours_chart: HoursChartPoint[];
};

export default function Dashboard({
    month,
    month_entry_count,
    month_minutes,
    month_earnings_cents,
    month_breakdown,
    hours_chart,
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
                        <CardTitle className="text-lg">Uren per maand</CardTitle>
                        <CardDescription>Laatste 6 maanden</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div aria-label="Uren per maand grafiek" className="relative h-44" role="img">
                            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                                {[0, 1, 2, 3].map((line) => (
                                    <div key={line} className="border-border/60 border-t" />
                                ))}
                            </div>

                            <div className="absolute inset-0 flex items-end justify-between gap-3 px-1 sm:gap-4">
                                {hours_chart.map((point) => (
                                    <div key={point.month} className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                                        {point.hours > 0 && (
                                            <span
                                                className="text-muted-foreground absolute text-[11px] tabular-nums"
                                                style={{ bottom: `calc(${point.percent}% + 0.4rem)` }}
                                            >
                                                {point.hours.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}
                                            </span>
                                        )}
                                        <div
                                            className="bg-foreground/80 w-2.5 rounded-t-sm sm:w-3"
                                            style={{
                                                height: point.minutes > 0 ? `${Math.max(point.percent, 3)}%` : '0%',
                                            }}
                                            title={`${formatShortMonth(point.month)}: ${formatDuration(point.minutes)}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between gap-3 px-1 sm:gap-4">
                            {hours_chart.map((point) => (
                                <span
                                    key={point.month}
                                    className="text-muted-foreground min-w-0 flex-1 text-center text-xs capitalize"
                                >
                                    {formatShortMonth(point.month)}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

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
