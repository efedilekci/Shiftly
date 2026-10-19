import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';

export default function AdminLayout({ children, title }: PropsWithChildren<{ title: string }>) {
    return (
        <>
            <Head title={title} />
            <div className="bg-background text-foreground min-h-screen">
                <header className="border-border/60 bg-background/80 supports-backdrop-filter:bg-background/70 sticky top-0 z-20 border-b backdrop-blur">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-10">
                        <p className="font-display text-lg font-extrabold tracking-tight">Shiftly Admin</p>
                        <Link
                            href={route('dashboard')}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
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
