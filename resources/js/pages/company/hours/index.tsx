import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

type Company = {
    id: number;
    name: string;
    slug: string;
    hour_approval_mode: string;
    hour_approval_mode_label: string;
};

type Membership = {
    role: string;
    can_approve_hours: boolean;
};

type HourRow = {
    id: number;
    user_name: string;
    user_email: string | null;
    baan_name: string;
    work_date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    duration_minutes: number;
    earnings_cents: number;
    note: string | null;
    approval_status: string;
    approval_status_label: string;
    can_review: boolean;
};

const currency = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

const statusFilters = [
    { value: 'pending', label: 'In afwachting' },
    { value: 'approved', label: 'Goedgekeurd' },
    { value: 'rejected', label: 'Afgewezen' },
    { value: 'all', label: 'Alles' },
] as const;

function formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}m`;
}

function formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);

    return dateFormat.format(new Date(year, month - 1, day));
}

export default function CompanyHoursIndex({
    company,
    membership,
    filters,
    pendingCount,
    entries,
}: {
    company: Company;
    membership: Membership;
    filters: { status: string };
    pendingCount: number;
    entries: HourRow[];
}) {
    const { flash } = usePage().props as { flash?: { status?: string | null } };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: company.name, href: `/bedrijf/${company.slug}` },
        { title: 'Uren', href: `/bedrijf/${company.slug}/uren` },
    ];

    const setStatus = (status: string) => {
        router.get(route('company.hours.index', company.slug), { status }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} · Uren`} />
            <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:p-10">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Bedrijfsuren</h1>
                    <p className="text-muted-foreground text-sm">
                        {company.hour_approval_mode_label}
                        {pendingCount > 0 ? ` · ${pendingCount} in afwachting` : ''}
                    </p>
                </header>

                {flash?.status && (
                    <div className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm" role="status">
                        {flash.status}
                    </div>
                )}

                {!membership.can_approve_hours && company.hour_approval_mode !== 'auto' && (
                    <p className="text-muted-foreground text-sm">
                        Jij kunt uren niet goedkeuren. Met de huidige instelling doet alleen de eigenaar dat.
                    </p>
                )}

                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter op status">
                    {statusFilters.map((filter) => {
                        const active = filters.status === filter.value;

                        return (
                            <Button
                                key={filter.value}
                                type="button"
                                size="sm"
                                variant={active ? 'default' : 'outline'}
                                onClick={() => setStatus(filter.value)}
                                aria-pressed={active}
                            >
                                {filter.label}
                                {filter.value === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
                            </Button>
                        );
                    })}
                </div>

                <div className="bg-card overflow-hidden rounded-xl border">
                    <Table aria-label="Bedrijfsuren">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Datum</TableHead>
                                <TableHead>Medewerker</TableHead>
                                <TableHead>Tijd</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Gewerkt</TableHead>
                                <TableHead className="text-right">Verdiensten</TableHead>
                                <TableHead className="text-right">Acties</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-muted-foreground h-20 text-center">
                                        Geen uren gevonden voor deze filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{formatDate(entry.work_date)}</TableCell>
                                        <TableCell>
                                            <span className="block font-medium">{entry.user_name}</span>
                                            <span className="text-muted-foreground block text-xs">{entry.user_email}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="block">
                                                {entry.start_time}-{entry.end_time}
                                            </span>
                                            <span className="text-muted-foreground block text-xs">{entry.baan_name}</span>
                                        </TableCell>
                                        <TableCell>{entry.approval_status_label}</TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatDuration(entry.duration_minutes)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {currency.format(entry.earnings_cents / 100)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {entry.can_review ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            router.post(route('company.hours.approve', [company.slug, entry.id]), {}, {
                                                                preserveScroll: true,
                                                            })
                                                        }
                                                    >
                                                        Goedkeuren
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.post(route('company.hours.reject', [company.slug, entry.id]), {}, {
                                                                preserveScroll: true,
                                                            })
                                                        }
                                                    >
                                                        Afwijzen
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {membership.can_approve_hours && (
                    <p className="text-muted-foreground text-sm">
                        Goedgekeurde uren tellen mee in het{' '}
                        <Link href={route('company.dashboard', company.slug)} className="text-foreground underline underline-offset-4">
                            bedrijfsoverzicht
                        </Link>
                        .
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
