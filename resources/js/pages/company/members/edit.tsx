import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Company = { id: number; name: string; slug: string };

type Member = {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
    hourly_wage: string;
    can_change_role: boolean;
};

type RoleOption = { value: string; label: string };

export default function CompanyMemberEdit({
    company,
    member,
    assignableRoles = [],
}: {
    company: Company;
    member: Member;
    assignableRoles?: RoleOption[];
}) {
    const { data, setData, put, errors, processing } = useForm({
        hourly_wage: member.hourly_wage.replace('.', ','),
        role: member.role,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: company.name, href: `/bedrijf/${company.slug}` },
        { title: 'Medewerkers', href: `/bedrijf/${company.slug}/medewerkers` },
        { title: member.name, href: `/bedrijf/${company.slug}/medewerkers/${member.id}` },
    ];

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        put(route('company.members.update', [company.slug, member.id]));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${member.name} · Medewerker`} />
            <div className="mx-auto w-full max-w-2xl space-y-8 px-5 py-8 sm:p-10">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Medewerker bewerken</h1>
                    <p className="text-muted-foreground text-sm">
                        {member.name} · {member.email}
                    </p>
                </header>

                <form onSubmit={submit} className="space-y-6" aria-busy={processing}>
                    <div className="grid gap-2">
                        <Label htmlFor="hourly_wage">Uurloon in euro</Label>
                        <Input
                            id="hourly_wage"
                            name="hourly_wage"
                            inputMode="decimal"
                            value={data.hourly_wage}
                            onChange={(event) => setData('hourly_wage', event.target.value)}
                            required
                            maxLength={12}
                            placeholder="15,00"
                            disabled={processing}
                            aria-invalid={!!errors.hourly_wage}
                        />
                        <p className="text-muted-foreground text-sm">
                            Dit uurloon geldt voor de bedrijfsbaan bij {company.name}. De medewerker kan dit zelf niet
                            wijzigen.
                        </p>
                        <InputError message={errors.hourly_wage} />
                    </div>

                    {member.can_change_role ? (
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                <SelectTrigger id="role" aria-label="Rol">
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
                            <InputError message={errors.role} />
                        </div>
                    ) : (
                        <div className="grid gap-1">
                            <p className="text-sm font-medium">Rol</p>
                            <p className="text-muted-foreground text-sm">{member.role_label}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Opslaan...' : 'Opslaan'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={route('company.members.index', company.slug)}>Terug</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
