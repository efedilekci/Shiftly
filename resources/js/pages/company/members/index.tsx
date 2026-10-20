import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

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

function formatDuration(minutes: number): string {
    return `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}m`;
}

export default function CompanyMembersIndex({
    company,
    membership,
    members,
}: {
    company: Company;
    membership: Membership;
    members: Member[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: company.name, href: `/bedrijf/${company.slug}` },
        { title: 'Medewerkers', href: `/bedrijf/${company.slug}/medewerkers` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} · Medewerkers`} />
            <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:p-10">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Medewerkers</h1>
                    <p className="text-muted-foreground text-sm">Overzicht van het team bij {company.name}.</p>
                </header>

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
            </div>
        </AppLayout>
    );
}
