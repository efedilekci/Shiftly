import HoursDataTable from '@/components/uren/data-table';
import HourEntryDialog from '@/components/uren/hour-entry-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type Baan } from '@/types/baan';
import { type HourEntry } from '@/types/hour-entry';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Uren', href: '/uren' }];

export default function Uren({
    entries,
    banen,
    today,
    status,
    rejectedCompanyHoursCount = 0,
    editEntryId = null,
}: {
    entries: HourEntry[];
    banen: Baan[];
    today: string;
    status?: string;
    rejectedCompanyHoursCount?: number;
    editEntryId?: number | null;
}) {
    const editEntry = editEntryId ? entries.find((entry) => entry.id === editEntryId) : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Uren" />
            <div className="w-full space-y-6 px-5 py-8 sm:px-8 sm:py-10">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="font-display text-3xl font-semibold tracking-tight">Uren</h1>
                    <HourEntryDialog banen={banen} today={today} />
                </header>
                {editEntry && <HourEntryDialog banen={banen} today={today} entry={editEntry} defaultOpen showTrigger={false} />}
                {status && (
                    <p role="status" className="text-primary text-sm">
                        {status}
                    </p>
                )}
                {rejectedCompanyHoursCount > 0 && (
                    <div className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm" role="status">
                        {rejectedCompanyHoursCount === 1
                            ? '1 bedrijfsregistratie is afgewezen. Pas de uren aan om ze opnieuw in te dienen.'
                            : `${rejectedCompanyHoursCount} bedrijfsregistraties zijn afgewezen. Pas ze aan om opnieuw in te dienen.`}
                    </div>
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
