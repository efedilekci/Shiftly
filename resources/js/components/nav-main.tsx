import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const { setOpenMobile } = useSidebar();
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Werkplek</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={item.url === page.url.split('?')[0]} tooltip={item.title}>
                            <Link
                                href={item.url}
                                prefetch
                                onClick={() => setOpenMobile(false)}
                                aria-current={item.url === page.url.split('?')[0] ? 'page' : undefined}
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
