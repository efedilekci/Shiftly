import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import type { Role } from '@/types';

type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: Role;
    created_at: string | null;
};

const roleLabel: Record<Role, string> = {
    user: 'Gebruiker',
    admin: 'Admin',
};

const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

function formatDate(value: string | null): string {
    if (!value) return '—';
    const [year, month, day] = value.split('-').map(Number);

    return dateFormat.format(new Date(year, month - 1, day));
}

export default function AdminUsersIndex({ users }: { users: AdminUser[] }) {
    return (
        <AdminLayout title="Gebruikers">
            <div className="space-y-6">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight">Gebruikers</h1>
                    <p className="text-muted-foreground text-sm">
                        {users.length} {users.length === 1 ? 'gebruiker' : 'gebruikers'}
                    </p>
                </header>

                <div className="bg-card overflow-hidden rounded-xl border">
                    <Table aria-label="Gebruikers">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Naam</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Lid sinds</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                                        Nog geen gebruikers.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell className="tabular-nums">{user.email}</TableCell>
                                        <TableCell>{roleLabel[user.role]}</TableCell>
                                        <TableCell className="tabular-nums">{formatDate(user.created_at)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
}
