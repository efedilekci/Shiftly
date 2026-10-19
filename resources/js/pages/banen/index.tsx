import CreateBaanDialog from '@/components/banen/create-baan-dialog';
import BanenDataTable, { type Baan } from '@/components/banen/data-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Banen', href: '/banen' }];

export default function Banen({ banen, status }: { banen: Baan[]; status?: string }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Banen" />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-5 py-8 sm:p-10">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-3xl font-semibold tracking-tight">Banen</h1>
                    <CreateBaanDialog />
                </header>
                {status && (
                    <p role="status" className="text-primary text-sm">
                        {status}
                    </p>
                )}
                <BanenDataTable banen={banen} />
            </div>
        </AppLayout>
    );
}
