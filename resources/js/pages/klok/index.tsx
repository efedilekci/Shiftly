import InputError from '@/components/input-error';
import CancelClockDialog from '@/components/klok/cancel-clock-dialog';
import StopClockDialog from '@/components/klok/stop-clock-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { type Baan } from '@/types/baan';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEventHandler, useEffect, useId, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Klok', href: '/klok' }];
type ActiveClock = { baan_name: string; started_at: number };

function ActiveClockPanel({ clock, serverNow, timezone }: { clock: ActiveClock; serverNow: number; timezone: string }) {
    const [elapsed, setElapsed] = useState(Math.max(0, serverNow - clock.started_at));
    useEffect(() => {
        const renderedAt = Date.now();
        const update = () => setElapsed(Math.max(0, serverNow - clock.started_at + Math.floor((Date.now() - renderedAt) / 1000)));
        update();
        const interval = window.setInterval(update, 1000);
        return () => window.clearInterval(interval);
    }, [serverNow, clock.started_at]);
    const started = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short', timeZone: timezone }).format(
        new Date(clock.started_at * 1000),
    );
    const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const minutes = String(Math.floor(elapsed / 60) % 60).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    return (
        <section className="bg-card max-w-lg space-y-6 rounded-xl border p-6">
            <div className="space-y-2">
                <h2 className="font-semibold break-words">{clock.baan_name}</h2>
                <p className="text-muted-foreground text-sm">Ingeklokt op {started}</p>
            </div>
            <p
                role="timer"
                aria-label="Duur van de huidige dienst"
                aria-live="off"
                className="font-mono text-4xl font-semibold tabular-nums sm:text-5xl"
            >
                {hours}:{minutes}:{seconds}
            </p>
            <div className="flex flex-wrap gap-3">
                <StopClockDialog />
                <CancelClockDialog />
            </div>
        </section>
    );
}

export default function Klok({
    activeClock,
    banen,
    serverNow,
    timezone,
    status,
}: {
    activeClock: ActiveClock | null;
    banen: Baan[];
    serverNow: number;
    timezone: string;
    status?: string;
}) {
    const fieldId = useId();
    const { errors: pageErrors } = usePage<SharedData & { errors: Record<string, string> }>().props;
    const { data, setData, post, errors, processing } = useForm({ baan_id: banen.length === 1 ? String(banen[0].id) : '' });
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (!processing) post(route('clock.start'));
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Klok" />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-5 py-8 sm:p-10">
                <h1 className="font-display text-3xl font-semibold tracking-tight">Klok</h1>
                {status && (
                    <p role="status" className="text-primary text-sm">
                        {status}
                    </p>
                )}
                <InputError message={pageErrors.clock} />
                {activeClock ? (
                    <ActiveClockPanel clock={activeClock} serverNow={serverNow} timezone={timezone} />
                ) : (
                    <form onSubmit={submit} className="bg-card max-w-lg space-y-6 rounded-xl border p-6" aria-busy={processing}>
                        <div className="grid gap-2">
                            <Label htmlFor={fieldId}>Baan</Label>
                            <select
                                id={fieldId}
                                value={data.baan_id}
                                onChange={(event) => setData('baan_id', event.target.value)}
                                required
                                disabled={processing || banen.length === 0}
                                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm disabled:opacity-50"
                                aria-invalid={!!errors.baan_id}
                                aria-describedby={errors.baan_id ? `${fieldId}-error` : undefined}
                            >
                                <option value="" disabled>
                                    Kies een baan
                                </option>
                                {banen.map((baan) => (
                                    <option key={baan.id} value={baan.id}>
                                        {baan.name}
                                    </option>
                                ))}
                            </select>
                            <InputError id={`${fieldId}-error`} message={errors.baan_id} />
                        </div>
                        {banen.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                <Link href={route('banen.index')} className="text-foreground underline underline-offset-4">
                                    Voeg eerst een baan toe
                                </Link>{' '}
                                om in te klokken.
                            </p>
                        )}
                        <Button type="submit" disabled={processing || banen.length === 0}>
                            {processing ? 'Inklokken...' : 'Inklokken'}
                        </Button>
                    </form>
                )}
                <Link href={route('uren.index')} className="text-muted-foreground inline-block rounded-md text-sm underline underline-offset-4">
                    Naar mijn uren
                </Link>
            </div>
        </AppLayout>
    );
}
