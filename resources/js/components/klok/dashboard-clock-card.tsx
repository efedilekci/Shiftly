import InputError from '@/components/input-error';
import CancelClockDialog from '@/components/klok/cancel-clock-dialog';
import StopClockDialog from '@/components/klok/stop-clock-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { type SharedData } from '@/types';
import { type Baan } from '@/types/baan';
import { Link, useForm, usePage } from '@inertiajs/react';
import { type FormEventHandler, useEffect, useId, useState } from 'react';

type ActiveClock = { baan_name: string; started_at: number };

function LiveTimer({ clock, serverNow, timezone }: { clock: ActiveClock; serverNow: number; timezone: string }) {
    const [elapsed, setElapsed] = useState(Math.max(0, serverNow - clock.started_at));

    useEffect(() => {
        const renderedAt = Date.now();
        const update = () => setElapsed(Math.max(0, serverNow - clock.started_at + Math.floor((Date.now() - renderedAt) / 1000)));
        update();
        const interval = window.setInterval(update, 1000);

        return () => window.clearInterval(interval);
    }, [serverNow, clock.started_at]);

    const started = new Intl.DateTimeFormat('nl-NL', { timeStyle: 'short', timeZone: timezone }).format(new Date(clock.started_at * 1000));
    const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const minutes = String(Math.floor(elapsed / 60) % 60).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');

    return (
        <div className="space-y-3">
            <div className="space-y-0.5">
                <p className="text-sm font-medium break-words">{clock.baan_name}</p>
                <p className="text-muted-foreground text-xs">Sinds {started}</p>
            </div>
            <p role="timer" aria-label="Duur van de huidige dienst" aria-live="off" className="font-mono text-2xl font-semibold tabular-nums">
                {hours}:{minutes}:{seconds}
            </p>
            <div className="flex flex-wrap gap-2">
                <StopClockDialog redirect="dashboard" />
                <CancelClockDialog redirect="dashboard" />
            </div>
        </div>
    );
}

export default function DashboardClockCard({
    activeClock,
    banen,
    serverNow,
    timezone,
}: {
    activeClock: ActiveClock | null;
    banen: Baan[];
    serverNow: number;
    timezone: string;
}) {
    const fieldId = useId();
    const { errors: pageErrors } = usePage<SharedData & { errors: Record<string, string> }>().props;
    const { data, setData, post, errors, processing } = useForm({
        baan_id: banen.length === 1 ? String(banen[0].id) : '',
        redirect: 'dashboard' as const,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (!processing) {
            post(route('clock.start'));
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base">Klok</CardTitle>
                    <CardDescription className="text-xs">{activeClock ? 'Actieve dienst' : 'Snel inklokken'}</CardDescription>
                </div>
                <Link href={route('clock.index')} className="text-muted-foreground text-xs underline underline-offset-4">
                    Meer
                </Link>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <InputError message={pageErrors.clock} />
                {activeClock ? (
                    <LiveTimer clock={activeClock} serverNow={serverNow} timezone={timezone} />
                ) : banen.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        <Link href={route('banen.index')} className="text-foreground underline underline-offset-4">
                            Voeg een baan toe
                        </Link>
                    </p>
                ) : (
                    <form onSubmit={submit} className="space-y-3" aria-busy={processing}>
                        <div className="grid gap-1.5">
                            <Label htmlFor={fieldId} className="text-xs">
                                Baan
                            </Label>
                            <select
                                id={fieldId}
                                value={data.baan_id}
                                onChange={(event) => setData('baan_id', event.target.value)}
                                required
                                disabled={processing}
                                className="border-input bg-background h-9 w-full rounded-md border px-2.5 text-sm disabled:opacity-50"
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
                        <Button type="submit" size="sm" className="w-full" disabled={processing}>
                            {processing ? 'Inklokken...' : 'Inklokken'}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
