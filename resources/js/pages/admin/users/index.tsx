import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { filterAdminUsers, type AdminUserFilters, type AdminUserRow } from '@/lib/admin-user-filters';
import type { Role } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useId, useMemo, useState } from 'react';

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

function RoleSelect({ user }: { user: AdminUserRow }) {
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

export default function AdminUsersIndex({ users, status }: { users: AdminUserRow[]; status?: string }) {
    const fieldId = useId();
    const { errors, flash } = usePage().props as {
        errors?: Record<string, string>;
        flash?: { status?: string | null };
    };
    const [filters, setFilters] = useState<AdminUserFilters>({ search: '', role: '' });
    const filteredUsers = useMemo(() => filterAdminUsers(users, filters), [users, filters]);
    const hasFilters = Boolean(filters.search.trim() || filters.role);
    const statusMessage = status ?? flash?.status ?? null;
    const errorMessage = errors?.user ?? errors?.role ?? null;

    return (
        <AdminLayout title="Gebruikers">
            <div className="space-y-6">
                <header>
                    <h1 className="font-display text-3xl font-semibold tracking-tight">Gebruikers</h1>
                </header>

                <div className="space-y-3">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`${fieldId}-search`}>Zoeken</Label>
                            <Input
                                id={`${fieldId}-search`}
                                value={filters.search}
                                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                                placeholder="Naam of e-mail..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`${fieldId}-role`}>Rol</Label>
                            <select
                                id={`${fieldId}-role`}
                                value={filters.role}
                                onChange={(event) => setFilters({ ...filters, role: event.target.value as AdminUserFilters['role'] })}
                                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                            >
                                <option value="">Alle rollen</option>
                                <option value="user">{roleLabel.user}</option>
                                <option value="admin">{roleLabel.admin}</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm">
                            <span className="font-semibold tabular-nums">{filteredUsers.length}</span>
                            <span className="text-muted-foreground">
                                {' '}
                                van {users.length} {users.length === 1 ? 'gebruiker' : 'gebruikers'}
                            </span>
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!hasFilters}
                            onClick={() => setFilters({ search: '', role: '' })}
                        >
                            Filters wissen
                        </Button>
                    </div>
                </div>

                {statusMessage && (
                    <p role="status" className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm">
                        {statusMessage}
                    </p>
                )}
                {errorMessage && (
                    <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">
                        {errorMessage}
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
                                <TableHead className="w-28 text-right">
                                    <span className="sr-only">Acties</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                                        {users.length === 0 ? 'Nog geen gebruikers.' : 'Geen gebruikers gevonden.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={route('admin.users.show', user.id)}
                                                prefetch
                                                className="text-foreground underline underline-offset-4"
                                            >
                                                {user.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="tabular-nums">{user.email}</TableCell>
                                        <TableCell>
                                            <RoleSelect user={user} />
                                        </TableCell>
                                        <TableCell className="tabular-nums">{formatDate(user.created_at)}</TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={route('admin.users.show', user.id)}
                                                prefetch
                                                className="text-sm underline underline-offset-4"
                                            >
                                                Bekijken
                                            </Link>
                                        </TableCell>
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
