import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const currency = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

type Company = { id: number; name: string; slug: string };

type Membership = {
    role: string;
    role_label: string;
    can_manage_members: boolean;
    can_view_hours: boolean;
};

type Stats = {
    members: number;
    month_minutes: number;
    month_earnings_cents: number;
};

type RecentEntry = {
    id: number;
    user_name: string;
    baan_name: string;
    work_date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    earnings_cents: number;
};

function formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}m`;
}

function formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);

    return dateFormat.format(new Date(year, month - 1, day));
}

export default function CompanyDashboard({
    company,
    membership,
    stats,
    recentEntries,
}: {
    company: Company;
    membership: Membership;
    stats: Stats;
    recentEntries: RecentEntry[];
}) {
    const { flash } = usePage().props as { flash?: { status?: string | null } };
    const breadcrumbs: BreadcrumbItem[] = [
        { title: company.name, href: `/bedrijf/${company.slug}` },
        { title: 'Overzicht', href: `/bedrijf/${company.slug}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} · Overzicht`} />
            <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:p-10">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Bedrijfsoverzicht</h1>
                    <p className="text-muted-foreground text-sm">
                        Je bent {membership.role_label.toLowerCase()} bij {company.name}.
                    </p>
                </header>

                {flash?.status && (
                    <div className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm" role="status">
                        {flash.status}
                    </div>
                )}

                <section aria-label="Samenvatting" className="grid gap-4 sm:grid-cols-3">
                    {[
                        { label: 'Medewerkers', value: String(stats.members) },
                        { label: 'Uren deze maand', value: formatDuration(stats.month_minutes) },
                        { label: 'Verdiensten deze maand', value: currency.format(stats.month_earnings_cents / 100) },
                    ].map((item) => (
                        <div key={item.label} className="border-border space-y-1 rounded-xl border px-4 py-3">
                            <p className="text-muted-foreground text-sm">{item.label}</p>
                            <p className="text-xl font-semibold tabular-nums">{item.value}</p>
                        </div>
                    ))}
                </section>

                <Link
                    href={route('company.members.index', company.slug)}
                    className="bg-primary text-primary-foreground inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-medium"
                >
                    Medewerkers bekijken
                </Link>

                {membership.can_view_hours && (
                    <section className="space-y-3">
                        <h2 className="font-display text-xl font-semibold tracking-tight">Recente uren</h2>
                        <div className="bg-card overflow-hidden rounded-xl border">
                            <Table aria-label="Recente uren van medewerkers">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Datum</TableHead>
                                        <TableHead>Medewerker</TableHead>
                                        <TableHead>Baan</TableHead>
                                        <TableHead>Tijd</TableHead>
                                        <TableHead className="text-right">Gewerkt</TableHead>
                                        <TableHead className="text-right">Verdiensten</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-muted-foreground h-20 text-center">
                                                Nog geen urenregistraties van medewerkers.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentEntries.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell>{formatDate(entry.work_date)}</TableCell>
                                                <TableCell>{entry.user_name}</TableCell>
                                                <TableCell>{entry.baan_name}</TableCell>
                                                <TableCell>
                                                    {entry.start_time}-{entry.end_time}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {formatDuration(entry.duration_minutes)}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {currency.format(entry.earnings_cents / 100)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
