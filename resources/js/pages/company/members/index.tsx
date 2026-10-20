import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Company = { id: number; name: string; slug: string };

type Membership = {
    role: string;
    can_manage_members: boolean;
    can_view_hours: boolean;
};

type Member = {
    id: number;
    user_id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
    month_minutes: number | null;
};

type Invitation = {
    id: number;
    email: string;
    role: string;
    role_label: string;
    expires_at: string;
    is_expired: boolean;
};

type RoleOption = { value: string; label: string };

function formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}m`;
}

export default function CompanyMembersIndex({
    company,
    membership,
    members,
    invitations = [],
    assignableRoles = [],
}: {
    company: Company;
    membership: Membership;
    members: Member[];
    invitations?: Invitation[];
    assignableRoles?: RoleOption[];
}) {
    const { flash } = usePage().props as { flash?: { status?: string | null } };
    const inviteForm = useForm({
        email: '',
        role: assignableRoles[0]?.value ?? 'employee',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: company.name, href: `/bedrijf/${company.slug}` },
        { title: 'Medewerkers', href: `/bedrijf/${company.slug}/medewerkers` },
    ];

    const submitInvite: FormEventHandler = (e) => {
        e.preventDefault();
        inviteForm.post(route('company.invitations.store', company.slug), {
            preserveScroll: true,
            onSuccess: () => inviteForm.reset('email'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} · Medewerkers`} />
            <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:p-10">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Medewerkers</h1>
                    <p className="text-muted-foreground text-sm">Overzicht van het team bij {company.name}.</p>
                </header>

                {flash?.status && (
                    <div className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm" role="status">
                        {flash.status}
                    </div>
                )}

                {membership.can_manage_members && (
                    <section className="border-border space-y-4 rounded-xl border p-5">
                        <div className="space-y-1">
                            <h2 className="font-display text-xl font-semibold tracking-tight">Medewerker uitnodigen</h2>
                            <p className="text-muted-foreground text-sm">
                                Geen e-mail: de uitnodiging verschijnt in de inbox van dit e-mailadres op Shiftly.
                            </p>
                        </div>
                        <form className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end" onSubmit={submitInvite}>
                            <div className="grid gap-2">
                                <Label htmlFor="invite-email">E-mailadres</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    required
                                    value={inviteForm.data.email}
                                    onChange={(e) => inviteForm.setData('email', e.target.value)}
                                    placeholder="naam@bedrijf.nl"
                                />
                                <InputError message={inviteForm.errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="invite-role">Rol</Label>
                                <Select value={inviteForm.data.role} onValueChange={(value) => inviteForm.setData('role', value)}>
                                    <SelectTrigger id="invite-role">
                                        <SelectValue placeholder="Kies rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assignableRoles.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={inviteForm.errors.role} />
                            </div>
                            <Button type="submit" disabled={inviteForm.processing}>
                                Uitnodigen
                            </Button>
                        </form>
                    </section>
                )}

                <div className="bg-card overflow-hidden rounded-xl border">
                    <Table aria-label="Bedrijfsmedewerkers">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Naam</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Rol</TableHead>
                                {membership.can_view_hours && <TableHead className="text-right">Uren deze maand</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>{member.role_label}</TableCell>
                                    {membership.can_view_hours && (
                                        <TableCell className="text-right tabular-nums">
                                            {member.month_minutes === null ? '-' : formatDuration(member.month_minutes)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {membership.can_manage_members && invitations.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="font-display text-xl font-semibold tracking-tight">Openstaande uitnodigingen</h2>
                        <div className="bg-card overflow-hidden rounded-xl border">
                            <Table aria-label="Openstaande uitnodigingen">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>E-mail</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actie</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((invitation) => (
                                        <TableRow key={invitation.id}>
                                            <TableCell>{invitation.email}</TableCell>
                                            <TableCell>{invitation.role_label}</TableCell>
                                            <TableCell>{invitation.is_expired ? 'Verlopen' : 'In afwachting'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.delete(route('company.invitations.destroy', [company.slug, invitation.id]), {
                                                            preserveScroll: true,
                                                        })
                                                    }
                                                >
                                                    Intrekken
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
