import DeleteAdminUserDialog from '@/components/admin/delete-user-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import type { Role } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: Role;
    created_at: string | null;
};

type Stats = {
    banen_count: number;
    entry_count: number;
    total_minutes: number;
    total_earnings_cents: number;
};

type BaanRow = {
    id: number;
    name: string;
    hourly_wage: string;
};

type CompanyMembership = {
    id: number;
    name: string;
    slug: string | null;
    role: string;
    role_label: string;
    is_owner: boolean;
};

type RecentEntry = {
    id: number;
    baan_name: string;
    work_date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    earnings_cents: number;
    note: string | null;
};

const roleLabel: Record<Role, string> = {
    user: 'Gebruiker',
    admin: 'Admin',
};

const currency = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

function formatDate(value: string | null): string {
    if (!value) return '-';
    const [year, month, day] = value.split('-').map(Number);

    return dateFormat.format(new Date(year, month - 1, day));
}

function formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}m`;
}

export default function AdminUserShow({
    user,
    stats,
    banen,
    companies,
    recent_entries,
    can_delete,
    delete_blocked_reason,
}: {
    user: AdminUser;
    stats: Stats;
    banen: BaanRow[];
    companies: CompanyMembership[];
    recent_entries: RecentEntry[];
    can_delete: boolean;
    delete_blocked_reason: string | null;
}) {
    const { errors } = usePage().props as { errors?: Record<string, string> };

    return (
        <AdminLayout title={user.name}>
            <div className="space-y-8">
                <div className="space-y-4">
                    <Link
                        href={route('admin.users.index')}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
                    >
                        <ArrowLeft className="size-4" aria-hidden />
                        Terug naar gebruikers
                    </Link>

                    <header className="space-y-1">
                        <h1 className="font-display text-3xl font-semibold tracking-tight">{user.name}</h1>
                        <p className="text-muted-foreground text-sm tabular-nums">{user.email}</p>
                    </header>

                    {errors?.user && (
                        <p role="alert" className="text-destructive text-sm">
                            {errors.user}
                        </p>
                    )}

                    <dl className="text-sm sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
                        <div className="flex gap-2">
                            <dt className="text-muted-foreground">Rol</dt>
                            <dd>{roleLabel[user.role]}</dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="text-muted-foreground">Lid sinds</dt>
                            <dd className="tabular-nums">{formatDate(user.created_at)}</dd>
                        </div>
                    </dl>
                </div>

                <section aria-label="Samenvatting" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Banen', value: String(stats.banen_count) },
                        { label: 'Registraties', value: String(stats.entry_count) },
                        { label: 'Gewerkt', value: formatDuration(stats.total_minutes) },
                        { label: 'Verdiensten', value: currency.format(stats.total_earnings_cents / 100) },
                    ].map((item) => (
                        <div key={item.label} className="border-border space-y-1 rounded-xl border px-4 py-3">
                            <p className="text-muted-foreground text-sm">{item.label}</p>
                            <p className="text-xl font-semibold tabular-nums">{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="space-y-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight">Banen</h2>
                    <div className="bg-card overflow-hidden rounded-xl border">
                        <Table aria-label="Banen van gebruiker">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Naam</TableHead>
                                    <TableHead className="text-right">Uurloon</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {banen.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-muted-foreground h-20 text-center">
                                            Geen banen.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    banen.map((baan) => (
                                        <TableRow key={baan.id}>
                                            <TableCell className="font-medium">{baan.name}</TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {currency.format(Number(baan.hourly_wage))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight">Bedrijven</h2>
                    <div className="bg-card overflow-hidden rounded-xl border">
                        <Table aria-label="Bedrijfslidmaatschappen">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bedrijf</TableHead>
                                    <TableHead>Rol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companies.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-muted-foreground h-20 text-center">
                                            Geen bedrijfslidmaatschappen.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    companies.map((membership) => (
                                        <TableRow key={membership.id}>
                                            <TableCell className="font-medium">
                                                {membership.slug ? (
                                                    <Link
                                                        href={route('admin.companies.show', membership.slug)}
                                                        className="underline underline-offset-4"
                                                    >
                                                        {membership.name}
                                                    </Link>
                                                ) : (
                                                    membership.name
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {membership.role_label}
                                                {membership.is_owner ? ' · Eigenaaraccount' : ''}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight">Recente uren</h2>
                    <div className="bg-card overflow-hidden rounded-xl border">
                        <Table aria-label="Recente uren van gebruiker">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Datum</TableHead>
                                    <TableHead>Baan</TableHead>
                                    <TableHead>Tijd</TableHead>
                                    <TableHead className="text-right">Gewerkt</TableHead>
                                    <TableHead className="text-right">Verdiensten</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recent_entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-muted-foreground h-20 text-center">
                                            Geen urenregistraties.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    recent_entries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="tabular-nums">{formatDate(entry.work_date)}</TableCell>
                                            <TableCell className="max-w-xs font-medium [overflow-wrap:anywhere] whitespace-normal">
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

                <section className="space-y-3 border-t pt-6">
                    <h2 className="font-display text-xl font-semibold tracking-tight">Gevaarlijke zone</h2>
                    {can_delete ? (
                        <DeleteAdminUserDialog user={{ id: user.id, name: user.name }} />
                    ) : (
                        <p className="text-muted-foreground text-sm">{delete_blocked_reason}</p>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
