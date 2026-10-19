import { isNavItemActive, mainNavItems } from '@/lib/main-nav';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';

export default function MobileBottomNav() {
    const { url } = usePage();

    return (
        <nav
            aria-label="Hoofdnavigatie"
            className="border-border bg-background/95 supports-backdrop-filter:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
        >
            <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                {mainNavItems.map((item) => {
                    const active = isNavItemActive(url, item.url);
                    const Icon = item.icon;

                    return (
                        <li key={item.title}>
                            <Link
                                href={item.url}
                                prefetch
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'text-muted-foreground flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium transition-colors',
                                    active && 'text-foreground',
                                )}
                            >
                                {Icon && <Icon className="size-5" aria-hidden />}
                                <span>{item.title}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
