import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:p-10">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welkom, {auth.user.name}.</h1>
            </div>
        </AppLayout>
    );
}
