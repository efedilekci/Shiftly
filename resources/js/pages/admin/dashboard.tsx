import AdminLayout from '@/layouts/admin-layout';
import { Link } from '@inertiajs/react';

export default function AdminDashboard() {
    return (
        <AdminLayout title="Admin">
            <header className="space-y-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight">Overzicht</h1>
                <p className="text-muted-foreground text-sm">
                    Beheer Shiftly vanaf hier.{' '}
                    <Link href={route('admin.users.index')} className="text-foreground underline underline-offset-4">
                        Bekijk gebruikers
                    </Link>
                    .
                </p>
            </header>
        </AdminLayout>
    );
}
