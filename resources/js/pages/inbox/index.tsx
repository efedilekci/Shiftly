import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inbox', href: '/inbox' }];

type Invitation = {
    id: number;
    company_name: string;
    company_slug: string;
    role: string;
    role_label: string;
    invited_by: string | null;
    expires_at: string;
    is_expired: boolean;
    is_pending: boolean;
};

export default function InboxIndex({ invitations }: { invitations: Invitation[] }) {
    const { flash, errors } = usePage().props as {
        flash?: { status?: string | null };
        errors?: { invitation?: string };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inbox" />
            <div className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:p-10">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Inbox</h1>
                    <p className="text-muted-foreground text-sm">Bedrijfsuitnodigingen voor jouw e-mailadres.</p>
                </header>

                {flash?.status && (
                    <div className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm" role="status">
                        {flash.status}
                    </div>
                )}
                <InputError message={errors?.invitation} />

                <div className="bg-card overflow-hidden rounded-xl border">
                    <Table aria-label="Inbox uitnodigingen">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bedrijf</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Van</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actie</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invitations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground h-20 text-center">
                                        Geen uitnodigingen.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invitations.map((invitation) => (
                                    <TableRow key={invitation.id}>
                                        <TableCell className="font-medium">{invitation.company_name}</TableCell>
                                        <TableCell>{invitation.role_label}</TableCell>
                                        <TableCell>{invitation.invited_by ?? '-'}</TableCell>
                                        <TableCell>{invitation.is_expired ? 'Verlopen' : 'Nieuw'}</TableCell>
                                        <TableCell className="text-right">
                                            {invitation.is_pending ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => router.post(route('inbox.accept', invitation.id))}
                                                >
                                                    Accepteren
                                                </Button>
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
            </div>
        </AppLayout>
    );
}
