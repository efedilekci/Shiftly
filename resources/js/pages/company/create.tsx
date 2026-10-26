import LeaveCompanyDialog from '@/components/company/leave-company-dialog';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Bedrijf', href: '/bedrijf/starten' }];

type Membership = {
    id: number;
    company_id: number;
    name: string;
    slug: string | null;
    role: string;
    role_label: string;
    can_leave: boolean;
};

export default function CreateCompany({
    memberships,
    status,
}: {
    memberships: Membership[];
    status?: string;
}) {
    const { flash, errors: pageErrors } = usePage().props as {
        flash?: { status?: string | null };
        errors?: Record<string, string>;
    };
    const statusMessage = status ?? flash?.status ?? null;
    const companyError = pageErrors?.company ?? null;
    const { data, setData, post, errors, processing } = useForm({
        name: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('company.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bedrijf" />
            <div className="mx-auto w-full max-w-2xl space-y-8 px-5 py-8 sm:p-10">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Bedrijf</h1>
                    <p className="text-muted-foreground text-sm">
                        Beheer je lidmaatschappen of start een nieuw bedrijf.
                    </p>
                </header>

                {statusMessage && (
                    <div className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm" role="status">
                        {statusMessage}
                    </div>
                )}
                {companyError && (
                    <p role="alert" className="text-destructive text-sm">
                        {companyError}
                    </p>
                )}

                <section className="space-y-3">
                    <h2 className="font-display text-xl font-semibold tracking-tight">Jouw bedrijven</h2>
                    <div className="bg-card overflow-hidden rounded-xl border">
                        <Table aria-label="Jouw bedrijfslidmaatschappen">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bedrijf</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead className="w-28 text-right">
                                        <span className="sr-only">Acties</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {memberships.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-muted-foreground h-20 text-center">
                                            Je bent nog geen lid van een bedrijf.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    memberships.map((membership) => (
                                        <TableRow key={membership.id}>
                                            <TableCell className="font-medium">
                                                {membership.slug && membership.role !== 'employee' ? (
                                                    <Link
                                                        href={route('company.dashboard', membership.slug)}
                                                        className="underline underline-offset-4"
                                                    >
                                                        {membership.name}
                                                    </Link>
                                                ) : (
                                                    membership.name
                                                )}
                                            </TableCell>
                                            <TableCell>{membership.role_label}</TableCell>
                                            <TableCell className="text-right">
                                                {membership.can_leave && membership.slug ? (
                                                    <LeaveCompanyDialog
                                                        companySlug={membership.slug}
                                                        companyName={membership.name}
                                                    />
                                                ) : membership.role === 'owner' ? (
                                                    <span className="text-muted-foreground text-xs">Eigenaar</span>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>

                <section className="space-y-6">
                    <header className="space-y-2">
                        <h2 className="font-display text-xl font-semibold tracking-tight">Nieuw bedrijf starten</h2>
                        <p className="text-muted-foreground text-sm">
                            Maak een bedrijf aan om medewerkers uit te nodigen en uren te beoordelen.
                        </p>
                    </header>

                    <form onSubmit={submit} className="space-y-6" aria-busy={processing}>
                        <div className="grid gap-2">
                            <Label htmlFor="company-name">Bedrijfsnaam</Label>
                            <Input
                                id="company-name"
                                type="text"
                                required
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                disabled={processing}
                                placeholder="Naam van je bedrijf"
                                aria-invalid={!!errors.name}
                            />
                            <InputError message={errors.name} />
                        </div>

                        <Button type="submit" disabled={processing}>
                            Bedrijf aanmaken
                        </Button>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
