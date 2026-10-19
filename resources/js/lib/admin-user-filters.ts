import type { Role } from '@/types';

export type AdminUserRow = {
    id: number;
    name: string;
    email: string;
    role: Role;
    created_at: string | null;
};

export type AdminUserFilters = {
    search: string;
    role: '' | Role;
};

export function filterAdminUsers(users: AdminUserRow[], filters: AdminUserFilters): AdminUserRow[] {
    const search = filters.search.trim().toLocaleLowerCase('nl-NL');

    return users.filter((user) => {
        if (filters.role && user.role !== filters.role) {
            return false;
        }

        if (!search) {
            return true;
        }

        return (
            user.name.toLocaleLowerCase('nl-NL').includes(search) ||
            user.email.toLocaleLowerCase('nl-NL').includes(search)
        );
    });
}
