import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

const currency = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

type Company = {
    id: number;
    name: string;
    slug: string;
    hour_approval_mode: string;
    hour_approval_mode_label: string;
    created_at: string | null;
    members_count: number;
    pending_invitations_count: number;
};

type Owner = {
    id: number;
    name: string;
    email: string | null;
};

type Member = {
    id: number;
    user_id: number;
    name: string;
    email: string | null;
    role: string;
    role_label: string;
};

type Invitation = {
    id: number;
    email: string;
    role: string;
    role_label: string;
    expires_at: string | null;
    created_at: string | null;
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
    approval_status: string;
    approval_status_label: string;
};

function formatDate(value: string | null): string {
    if (!value) return '-';
    const [year, month, day] = value.split('-').map(Number);

    return dateFormat.format(new Date(year, month - 1, day));
}

function formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}m`;
}

export default function AdminCompanyShow({
    company,
    owner,
    members,
    invitations,
    recent_entries,
}: {
    company: Company;
    owner: Owner;
    members: Member[];
    invitations: Invitation[];
    recent_entries: RecentEntry[];
}) {
    return (
        <AdminLayout title={company.name}>
            <div className="space-y-8">
                <div className="space-y-4">
                    <Link
                        href={route('admin.companies.index')}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
                    >
                        <ArrowLeft className="size-4" aria-hidden />
                        Terug naar bedrijven
                    </Link>

                    <header className="space-y-1">
                        <h1 className="font-display text-3xl font-semibold tracking-tight">{company.name}</h1>
                        <p className="text-muted-foreground text-sm tabular-nums">{company.slug}</p>
                    </header>

                    <dl className="text-sm sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
                        <div className="flex gap-2">
                            <dt className="text-muted-foreground">Eigenaar</dt>
                            <dd>
                                <Link href={route('admin.users.show', owner.id)} className="underline underline-offset-4">
                                    {owner.name}
                                </Link>
                            </dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="text-muted-foreground">Goedkeuring</dt>
                            <dd>{company.hour_approval_mode_label}</dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="text-muted-foreground">Aangemaakt</dt>
                            <dd className="tabular-nums">{formatDate(company.created_at)}</dd>
                        </div>
                    </dl>
                </div>

                <section aria-label="Samenvatting" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { label: 'Leden', value: String(company.members_count) },
                        { label: 'Openstaande uitnodigingen', value: String(company.pending_invitations_count) },
                    ].map((item) => (
                        <div key={item.label} className="border-border space-y-1 rounded-xl border px-4 py-3">
                            <p className="text-muted-foreground text-sm">{item.label}</p>
                            <p className="text-xl font-semibold tabular-nums">{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="space-y-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight">Leden</h2>
                    <div className="bg-card overflow-hidden rounded-xl border">
                        <Table aria-label="Bedrijfsleden">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Naam</TableHead>
                                    <TableHead>E-mail</TableHead>
                                    <TableHead>Rol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-muted-foreground h-20 text-center">
                                            Geen leden.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    members.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={route('admin.users.show', member.user_id)}
                                                    className="underline underline-offset-4"
                                                >
                                                    {member.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="tabular-nums">{member.email ?? '-'}</TableCell>
                                            <TableCell>{member.role_label}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight">Openstaande uitnodigingen</h2>
                    <div className="bg-card overflow-hidden rounded-xl border">
                        <Table aria-label="Openstaande uitnodigingen">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>E-mail</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Verstuurd</TableHead>
                                    <TableHead>Verloopt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invitations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-muted-foreground h-20 text-center">
                                            Geen openstaande uitnodigingen.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invitations.map((invitation) => (
                                        <TableRow key={invitation.id}>
                                            <TableCell className="font-medium tabular-nums">{invitation.email}</TableCell>
                                            <TableCell>{invitation.role_label}</TableCell>
                                            <TableCell className="tabular-nums">{formatDate(invitation.created_at)}</TableCell>
                                            <TableCell className="tabular-nums">{formatDate(invitation.expires_at)}</TableCell>
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
                        <Table aria-label="Recente bedrijfsuren">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Datum</TableHead>
                                    <TableHead>Gebruiker</TableHead>
                                    <TableHead>Baan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Gewerkt</TableHead>
                                    <TableHead className="text-right">Verdiensten</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recent_entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-muted-foreground h-20 text-center">
                                            Nog geen bedrijfsuren.
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
                                            <TableCell>{entry.approval_status_label}</TableCell>
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
