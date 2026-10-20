import { type NavItem } from '@/types';
import { BriefcaseBusiness, Clock3, Inbox, LayoutGrid, Timer } from 'lucide-react';

export const mainNavItems: NavItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
    { title: 'Banen', url: '/banen', icon: BriefcaseBusiness },
    { title: 'Uren', url: '/uren', icon: Clock3 },
    { title: 'Klok', url: '/klok', icon: Timer },
    { title: 'Inbox', url: '/inbox', icon: Inbox },
];

export function isNavItemActive(currentUrl: string, itemUrl: string): boolean {
    const path = currentUrl.split('?')[0];

    return path === itemUrl || path.startsWith(`${itemUrl}/`);
}
