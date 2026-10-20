import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { isNavItemActive } from '@/lib/main-nav';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Building2, Users } from 'lucide-react';
import { useMemo } from 'react';

function NavLink({ item }: { item: NavItem & { exact?: boolean } }) {
    const page = usePage<SharedData>();
    const { setOpenMobile } = useSidebar();
    const path = page.url.split('?')[0];
    const active = item.exact ? path === item.url || path === `${item.url}/` : isNavItemActive(page.url, item.url);
    const badge = item.url === '/inbox' ? page.props.pendingInvitationCount : 0;

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="rounded-lg">
                <Link href={item.url} prefetch onClick={() => setOpenMobile(false)} aria-current={active ? 'page' : undefined}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {badge > 0 && (
                        <span className="bg-foreground text-background ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums">
                            {badge}
                        </span>
                    )}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage<SharedData>();
    const companies = page.props.companies ?? [];

    const companySections = useMemo(() => {
        return companies.map((company) => ({
            label: companies.length === 1 ? company.name : `Bedrijf · ${company.name}`,
            items: [
                {
                    title: 'Overzicht',
                    url: `/bedrijf/${company.slug}`,
                    icon: Building2,
                    exact: true,
                },
                {
                    title: 'Medewerkers',
                    url: `/bedrijf/${company.slug}/medewerkers`,
                    icon: Users,
                },
            ],
        }));
    }, [companies]);

    return (
        <>
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel className="font-display text-[11px] tracking-[0.14em] uppercase">Werkplek</SidebarGroupLabel>
                <SidebarMenu>
                    {items.map((item) => (
                        <NavLink key={item.title} item={item} />
                    ))}
                </SidebarMenu>
            </SidebarGroup>

            {companySections.map((section) => (
                <SidebarGroup key={section.label} className="px-2 pt-2 pb-0">
                    <SidebarGroupLabel className="font-display text-[11px] tracking-[0.14em] uppercase">{section.label}</SidebarGroupLabel>
                    <SidebarMenu>
                        {section.items.map((item) => (
                            <NavLink key={item.url} item={item} />
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
