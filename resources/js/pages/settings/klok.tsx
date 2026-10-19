import InputError from '@/components/input-error';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useId } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Klok',
        href: '/settings/klok',
    },
];

export default function KlokSettings({
    reminder_amount,
    reminder_unit,
    status,
}: {
    reminder_amount: number;
    reminder_unit: 'minutes' | 'hours';
    status?: string;
}) {
    const fieldId = useId();
    const { flash } = usePage().props as { flash?: { status?: string | null } };
    const statusMessage = status ?? flash?.status ?? null;
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        reminder_amount: String(reminder_amount),
        reminder_unit,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        patch(route('clock-preferences.update'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Klokinstellingen" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Open-klok herinnering"
                        description="Kies na hoeveel tijd je een herinnering ziet dat je nog ingeklokt bent. 0 = meteen tonen."
                    />

                    {statusMessage && (
                        <p role="status" className="text-primary text-sm">
                            {statusMessage}
                        </p>
                    )}

                    <form onSubmit={submit} className="space-y-6" aria-busy={processing}>
                        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                            <div className="grid gap-2">
                                <Label htmlFor={`${fieldId}-amount`}>Na</Label>
                                <Input
                                    id={`${fieldId}-amount`}
                                    type="number"
                                    min={0}
                                    max={data.reminder_unit === 'hours' ? 24 : 1440}
                                    step={1}
                                    required
                                    value={data.reminder_amount}
                                    onChange={(event) => setData('reminder_amount', event.target.value)}
                                    disabled={processing}
                                    aria-invalid={!!errors.reminder_amount}
                                    aria-describedby={errors.reminder_amount ? `${fieldId}-amount-error` : undefined}
                                />
                                <InputError id={`${fieldId}-amount-error`} message={errors.reminder_amount} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`${fieldId}-unit`}>Eenheid</Label>
                                <select
                                    id={`${fieldId}-unit`}
                                    value={data.reminder_unit}
                                    onChange={(event) => setData('reminder_unit', event.target.value as 'minutes' | 'hours')}
                                    disabled={processing}
                                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm disabled:opacity-50"
                                    aria-invalid={!!errors.reminder_unit}
                                >
                                    <option value="minutes">Minuten</option>
                                    <option value="hours">Uren</option>
                                </select>
                                <InputError message={errors.reminder_unit} />
                            </div>
                        </div>

                        <p className="text-muted-foreground text-sm">
                            Voorbeeld: 2 uur betekent dat de banner pas verschijnt als je langer dan 2 uur ingeklokt bent.
                        </p>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Opslaan...' : 'Opslaan'}
                            </Button>
                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm">Opgeslagen</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
