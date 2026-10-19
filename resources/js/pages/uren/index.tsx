import HoursDataTable from '@/components/uren/data-table';
import HourEntryDialog from '@/components/uren/hour-entry-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Baan } from '@/types/baan';
import { type HourEntry } from '@/types/hour-entry';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Uren', href: '/uren' }];

export default function Uren({ entries, banen, today, status }: { entries: HourEntry[]; banen: Baan[]; today: string; status?: string }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Uren" />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-5 py-8 sm:p-10">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="font-display text-3xl font-semibold tracking-tight">Uren</h1>
                    <HourEntryDialog banen={banen} today={today} />
                </header>
                {status && (
                    <p role="status" className="text-primary text-sm">
                        {status}
                    </p>
                )}
                {banen.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                        <Link href={route('banen.index')} className="text-foreground underline underline-offset-4">
                            Voeg eerst een baan toe
                        </Link>{' '}
                        om uren te registreren.
                    </p>
                )}
                <HoursDataTable entries={entries} banen={banen} today={today} />
            </div>
        </AppLayout>
    );
}
