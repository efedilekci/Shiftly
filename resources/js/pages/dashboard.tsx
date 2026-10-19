import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <main className="flex flex-1 flex-col gap-4 p-6">
                <h1 className="text-2xl font-semibold">Welkom bij Shiftly</h1>
                <p className="text-muted-foreground max-w-xl">
                    Je account is klaar. Binnenkort kun je hier je banen, gewerkte uren en verdiensten bijhouden.
                </p>
            </main>
        </AppLayout>
    );
}
