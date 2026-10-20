import DeleteMemberDialog from '@/components/company/delete-member-dialog';
import InviteMemberDialog from '@/components/company/invite-member-dialog';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';

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
    const page = usePage<{
        flash?: { status?: string | null };
        auth: { user: { id: number } };
        errors?: { member?: string };
    }>();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: company.name, href: `/bedrijf/${company.slug}` },
        { title: 'Medewerkers', href: `/bedrijf/${company.slug}/medewerkers` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} · Medewerkers`} />
            <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:p-10">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Medewerkers</h1>
                        <p className="text-muted-foreground text-sm">Overzicht van het team bij {company.name}.</p>
                    </div>
                    {membership.can_manage_members && (
                        <InviteMemberDialog companySlug={company.slug} assignableRoles={assignableRoles} />
                    )}
                </header>

                {page.props.flash?.status && (
                    <div className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm" role="status">
                        {page.props.flash.status}
                    </div>
                )}
                <InputError message={page.props.errors?.member} />

                <div className="bg-card overflow-hidden rounded-xl border">
                    <Table aria-label="Bedrijfsmedewerkers">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Naam</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Rol</TableHead>
                                {membership.can_view_hours && <TableHead className="text-right">Uren deze maand</TableHead>}
                                {membership.can_manage_members && <TableHead className="text-right">Acties</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => {
                                const canEdit =
                                    membership.can_manage_members &&
                                    member.role !== 'owner' &&
                                    member.user_id !== page.props.auth.user.id;

                                return (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>
                                            {canEdit ? (
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(value) =>
                                                        router.patch(
                                                            route('company.members.role', [company.slug, member.id]),
                                                            { role: value },
                                                            { preserveScroll: true },
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-[160px]" aria-label={`Rol van ${member.name}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {assignableRoles.map((role) => (
                                                            <SelectItem key={role.value} value={role.value}>
                                                                {role.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                member.role_label
                                            )}
                                        </TableCell>
                                        {membership.can_view_hours && (
                                            <TableCell className="text-right tabular-nums">
                                                {member.month_minutes === null ? '-' : formatDuration(member.month_minutes)}
                                            </TableCell>
                                        )}
                                        {membership.can_manage_members && (
                                            <TableCell className="text-right">
                                                {canEdit ? (
                                                    <DeleteMemberDialog
                                                        companySlug={company.slug}
                                                        memberId={member.id}
                                                        memberName={member.name}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
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
