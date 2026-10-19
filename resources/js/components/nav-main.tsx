import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { isNavItemActive } from '@/lib/main-nav';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const { setOpenMobile } = useSidebar();
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="font-display text-[11px] tracking-[0.14em] uppercase">Werkplek</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isNavItemActive(page.url, item.url)} tooltip={item.title}>
                            <Link
                                href={item.url}
                                prefetch
                                onClick={() => setOpenMobile(false)}
                                aria-current={isNavItemActive(page.url, item.url) ? 'page' : undefined}
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
