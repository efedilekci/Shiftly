import AdminLayout from '@/layouts/admin-layout';

export default function AdminDashboard() {
    return (
        <AdminLayout title="Admin">
            <header className="space-y-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight">Overzicht</h1>
                <p className="text-muted-foreground text-sm">Eerste stap van de admin-area. Hier komen later meer beheerfuncties.</p>
            </header>
        </AdminLayout>
    );
}
