import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import OpenClockBanner from '@/components/klok/open-clock-banner';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import { type BreadcrumbItem } from '@/types';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="pb-20 md:pb-0">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <OpenClockBanner />
                {children}
            </AppContent>
            <MobileBottomNav />
        </AppShell>
    );
}
