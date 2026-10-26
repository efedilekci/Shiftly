import { isNavItemActive, mainNavItems } from '@/lib/main-nav';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export default function MobileBottomNav() {
    const { url, props } = usePage<SharedData>();
    const inboxBadge = props.pendingInboxCount ?? props.pendingInvitationCount ?? 0;

    return (
        <nav
            aria-label="Hoofdnavigatie"
            className="border-border bg-background/95 supports-backdrop-filter:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
        >
            <ul className="mx-auto grid max-w-lg grid-cols-5 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {mainNavItems.map((item) => {
                    const active = isNavItemActive(url, item.url);
                    const Icon = item.icon;
                    const badge = item.url === '/inbox' ? inboxBadge : 0;

                    return (
                        <li key={item.title}>
                            <Link
                                href={item.url}
                                prefetch
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'text-muted-foreground relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium transition-colors',
                                    active && 'text-foreground',
                                )}
                            >
                                {active ? <span aria-hidden className="bg-foreground absolute top-1 h-0.5 w-4 rounded-full" /> : null}
                                <span className="relative">
                                    {Icon && <Icon className="size-5" aria-hidden />}
                                    {badge > 0 && (
                                        <span className="bg-foreground text-background absolute -top-1.5 -right-2 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold tabular-nums leading-4">
                                            {badge}
                                        </span>
                                    )}
                                </span>
                                <span className={cn(active && 'font-display font-semibold')}>{item.title}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
