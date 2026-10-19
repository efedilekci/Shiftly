import StopClockDialog from '@/components/klok/stop-clock-dialog';
import { type SharedActiveClock, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function useElapsedSeconds(clock: SharedActiveClock | null, serverNow: number): number {
    const [elapsed, setElapsed] = useState(() => (clock ? Math.max(0, serverNow - clock.started_at) : 0));

    useEffect(() => {
        if (!clock) {
            setElapsed(0);

            return;
        }

        const renderedAt = Date.now();
        const update = () => setElapsed(Math.max(0, serverNow - clock.started_at + Math.floor((Date.now() - renderedAt) / 1000)));
        update();
        const interval = window.setInterval(update, 1000);

        return () => window.clearInterval(interval);
    }, [clock, serverNow]);

    return elapsed;
}

function LiveDuration({
    clock,
    elapsed,
    timezone,
}: {
    clock: SharedActiveClock;
    elapsed: number;
    timezone: string;
}) {
    const started = new Intl.DateTimeFormat('nl-NL', { timeStyle: 'short', timeZone: timezone }).format(new Date(clock.started_at * 1000));
    const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const minutes = String(Math.floor(elapsed / 60) % 60).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');

    return (
        <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate text-sm font-medium">
                Je bent nog ingeklokt bij <span className="font-semibold">{clock.baan_name}</span>
            </p>
            <p className="text-muted-foreground text-xs">
                Sinds {started} ·{' '}
                <span role="timer" aria-label="Duur van de huidige dienst" aria-live="off" className="font-mono tabular-nums">
                    {hours}:{minutes}:{seconds}
                </span>
            </p>
        </div>
    );
}

export default function OpenClockBanner() {
    const { activeClock, openClockReminderAfterMinutes, serverNow, timezone } = usePage<SharedData>().props;
    const elapsed = useElapsedSeconds(activeClock, serverNow);

    if (!activeClock) {
        return null;
    }

    const thresholdSeconds = Math.max(0, openClockReminderAfterMinutes) * 60;
    if (elapsed < thresholdSeconds) {
        return null;
    }

    return (
        <div
            role="status"
            className="border-border bg-muted/40 sticky top-0 z-10 border-b px-4 py-3 sm:px-6"
            aria-label="Open klok herinnering"
        >
            <div className="flex flex-wrap items-center gap-3">
                <LiveDuration clock={activeClock} elapsed={elapsed} timezone={timezone} />
                <div className="flex flex-wrap items-center gap-2">
                    <Link href={route('clock.index')} className="text-sm underline underline-offset-4">
                        Naar klok
                    </Link>
                    <StopClockDialog />
                </div>
            </div>
        </div>
    );
}
