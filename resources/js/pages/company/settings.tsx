import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Company = {
    id: number;
    name: string;
    slug: string;
    hour_approval_mode: string;
};

type HourApprovalMode = {
    value: string;
    label: string;
    description: string;
};

export default function CompanySettings({
    company,
    hourApprovalModes,
}: {
    company: Company;
    hourApprovalModes: HourApprovalMode[];
}) {
    const { flash } = usePage().props as { flash?: { status?: string | null } };
    const { data, setData, put, errors, processing } = useForm({
        name: company.name,
        hour_approval_mode: company.hour_approval_mode,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: company.name, href: `/bedrijf/${company.slug}` },
        { title: 'Instellingen', href: `/bedrijf/${company.slug}/instellingen` },
    ];

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        put(route('company.settings.update', company.slug));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} · Instellingen`} />
            <div className="mx-auto w-full max-w-2xl space-y-8 px-5 py-8 sm:p-10">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Bedrijfsinstellingen</h1>
                    <p className="text-muted-foreground text-sm">Beheer de naam en urengoedkeuring van {company.name}.</p>
                </header>

                {flash?.status && (
                    <div className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm" role="status">
                        {flash.status}
                    </div>
                )}

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
                            aria-invalid={!!errors.name}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <fieldset className="space-y-4">
                        <legend className="font-display text-xl font-semibold tracking-tight">Urengoedkeuring</legend>
                        <p className="text-muted-foreground text-sm">
                            Bepaal of nieuwe bedrijfsuren meteen meetellen, of eerst goedgekeurd moeten worden.
                        </p>

                        <div className="space-y-3" role="radiogroup" aria-label="Urengoedkeuring">
                            {hourApprovalModes.map((mode) => {
                                const selected = data.hour_approval_mode === mode.value;

                                return (
                                    <label
                                        key={mode.value}
                                        className={[
                                            'border-border flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
                                            selected ? 'bg-muted/50 border-foreground/30' : 'hover:bg-muted/30',
                                        ].join(' ')}
                                    >
                                        <input
                                            type="radio"
                                            name="hour_approval_mode"
                                            value={mode.value}
                                            checked={selected}
                                            onChange={() => setData('hour_approval_mode', mode.value)}
                                            className="mt-1"
                                            disabled={processing}
                                        />
                                        <span className="min-w-0 space-y-1">
                                            <Label className="cursor-pointer text-sm font-medium">{mode.label}</Label>
                                            <span className="text-muted-foreground block text-sm">{mode.description}</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        <InputError message={errors.hour_approval_mode} />
                    </fieldset>

                    <Button type="submit" disabled={processing}>
                        {processing ? 'Opslaan...' : 'Opslaan'}
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
