import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import type { Role } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

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

function RoleSelect({ user }: { user: AdminUser }) {
    const [role, setRole] = useState<Role>(user.role);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        setRole(user.role);
    }, [user.role]);

    return (
        <select
            aria-label={`Rol van ${user.name}`}
            className="border-input bg-background h-9 w-full max-w-40 rounded-md border px-2 text-sm disabled:opacity-50"
            value={role}
            disabled={pending}
            onChange={(event) => {
                const nextRole = event.target.value as Role;
                if (nextRole === user.role) return;
                setRole(nextRole);
                setPending(true);
                router.patch(
                    route('admin.users.role', user.id),
                    { role: nextRole },
                    {
                        preserveScroll: true,
                        onError: () => setRole(user.role),
                        onFinish: () => setPending(false),
                    },
                );
            }}
        >
            <option value="user">{roleLabel.user}</option>
            <option value="admin">{roleLabel.admin}</option>
        </select>
    );
}

export default function AdminUsersIndex({ users, status }: { users: AdminUser[]; status?: string }) {
    const { errors } = usePage().props as { errors?: Record<string, string> };

    return (
        <AdminLayout title="Gebruikers">
            <div className="space-y-6">
                <header className="space-y-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight">Gebruikers</h1>
                    <p className="text-muted-foreground text-sm">
                        {users.length} {users.length === 1 ? 'gebruiker' : 'gebruikers'}
                    </p>
                </header>

                {status && (
                    <p role="status" className="text-primary text-sm">
                        {status}
                    </p>
                )}
                {errors?.role && (
                    <p role="alert" className="text-destructive text-sm">
                        {errors.role}
                    </p>
                )}

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
                                        <TableCell>
                                            <RoleSelect user={user} />
                                        </TableCell>
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
