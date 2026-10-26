import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Bedrijf starten', href: '/bedrijf/starten' }];

export default function CreateCompany() {
    const { data, setData, post, errors, processing } = useForm({
        name: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('company.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bedrijf starten" />
            <div className="mx-auto w-full max-w-2xl space-y-8 px-5 py-8 sm:p-10">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Bedrijf starten</h1>
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
                            autoFocus
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
            </div>
        </AppLayout>
    );
}
