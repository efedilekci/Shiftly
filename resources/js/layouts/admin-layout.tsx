import { cn } from '@/lib/utils';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';

const adminNav = [
    { title: 'Overzicht', href: '/admin', routeName: 'admin.dashboard' },
    { title: 'Uren', href: '/admin/uren', routeName: 'admin.uren.index' },
    { title: 'Gebruikers', href: '/admin/users', routeName: 'admin.users.index' },
] as const;

export default function AdminLayout({ children, title }: PropsWithChildren<{ title: string }>) {
    const { url } = usePage();

    return (
        <>
            <Head title={title} />
            <div className="bg-background text-foreground min-h-screen">
                <header className="border-border/60 bg-background/80 supports-backdrop-filter:bg-background/70 sticky top-0 z-20 border-b backdrop-blur">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-10">
                        <div className="flex min-w-0 items-center gap-6">
                            <Link href={route('admin.dashboard')} className="font-display shrink-0 text-lg font-extrabold tracking-tight">
                                Shiftly Admin
                            </Link>
                            <nav aria-label="Admin" className="flex items-center gap-4 text-sm">
                                {adminNav.map((item) => {
                                    const active = item.routeName === 'admin.dashboard' ? url === '/admin' || url === '/admin/' : url.startsWith(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={route(item.routeName)}
                                            prefetch
                                            aria-current={active ? 'page' : undefined}
                                            className={cn(
                                                'underline-offset-4 transition-colors hover:underline',
                                                active ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {item.title}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                        <Link
                            href={route('dashboard')}
                            className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-2 text-sm underline-offset-4 hover:underline"
                        >
                            <ArrowLeft className="size-4" aria-hidden />
                            Terug naar app
                        </Link>
                    </div>
                </header>
                <main className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-10">{children}</main>
            </div>
        </>
    );
}
