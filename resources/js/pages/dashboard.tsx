import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

type DashboardProps = {
    month: string;
    month_entry_count: number;
    month_minutes: number;
    month_earnings_cents: number;
};

export default function Dashboard({ month, month_entry_count, month_minutes, month_earnings_cents }: DashboardProps) {
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
            </div>
        </AppLayout>
    );
}
