import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type SharedData, type User } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Building2, LogOut, Settings, Shield } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { companies } = usePage<SharedData>().props;

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                        <Link className="block w-full" href={route('admin.dashboard')} as="button" prefetch onClick={cleanup}>
                            <Shield className="mr-2" />
                            Admin
                        </Link>
                    </DropdownMenuItem>
                )}
                {companies.map((company) => (
                    <DropdownMenuItem key={company.id} asChild>
                        <Link
                            className="block w-full"
                            href={route('company.dashboard', company.slug)}
                            as="button"
                            prefetch
                            onClick={cleanup}
                        >
                            <Building2 className="mr-2" />
                            {company.name}
                        </Link>
                    </DropdownMenuItem>
                ))}
                {companies.length === 0 && (
                    <DropdownMenuItem asChild>
                        <Link
                            className="block w-full"
                            href={route('company.create')}
                            as="button"
                            prefetch
                            onClick={cleanup}
                        >
                            <Building2 className="mr-2" />
                            Bedrijf starten
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href={route('profile.edit')} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Instellingen
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className="block w-full" method="post" href={route('logout')} as="button" onClick={cleanup}>
                    <LogOut className="mr-2" />
                    Uitloggen
                </Link>
            </DropdownMenuItem>
        </>
    );
}
