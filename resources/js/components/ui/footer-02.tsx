// Rounded Top Footer from Hirael <https://hirael.com/blocks/footer/footer-02>
// MIT · Mohammad Shehadeh · https://github.com/MohammadShehadeh/hirael

import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import * as React from 'react';

interface FooterLink {
    label: string;
    href: string;
    external?: boolean;
}

interface FooterColumn {
    title: string;
    href: string;
    links: readonly FooterLink[];
}

const ENTER =
    'animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] fill-mode-both motion-reduce:animate-none';

const stagger = (index: number): React.CSSProperties => ({ animationDelay: `${index * 60}ms` });

const MAX_LINKS = 5;

const COLUMNS: readonly FooterColumn[] = [
    {
        title: 'Product',
        href: '#functies',
        links: [
            { label: 'Functies', href: '#functies' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Klok', href: '/klok' },
            { label: 'Uren', href: '/uren' },
            { label: 'Banen', href: '/banen' },
        ],
    },
    {
        title: 'Account',
        href: '/register',
        links: [
            { label: 'Registreren', href: '/register' },
            { label: 'Inloggen', href: '/login' },
            { label: 'Klokinstellingen', href: '/settings/klok' },
            { label: 'Profiel', href: '/settings/profile' },
        ],
    },
    {
        title: 'Meer',
        href: '/',
        links: [
            { label: 'Home', href: '/' },
            { label: 'Start gratis', href: '/register' },
            { label: 'Naar dashboard', href: '/dashboard' },
        ],
    },
];

function FooterAnchor({
    href,
    className,
    children,
}: {
    href: string;
    className?: string;
    children: React.ReactNode;
}) {
    const isHash = href.startsWith('#');

    if (isHash) {
        return (
            <a href={href} className={className}>
                {children}
            </a>
        );
    }

    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}

const Footer02 = () => {
    return (
        <footer data-slot="footer" className="relative mx-2 rounded-t-3xl border-t border-border bg-background xl:mx-4">
            <div data-slot="footer-inner" className="relative mx-auto w-full max-w-[1480px] px-4 py-12 lg:py-16">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(35%_128px_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]"
                />

                <div className="relative flex flex-col gap-10 lg:flex-row">
                    <div data-slot="footer-brand" className={cn(ENTER, 'flex flex-col gap-3 lg:w-1/3')}>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-foreground"
                        >
                            <span className="font-display text-base font-extrabold tracking-tight">Shiftly</span>
                        </Link>
                        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                            Uren, banen en verdiensten bijhouden. Van inklokken tot maandoverzicht, gebouwd voor
                            bijbanen en flexwerk.
                        </p>
                    </div>

                    <nav
                        data-slot="footer-nav"
                        aria-label="Footer"
                        className="grid flex-1 grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3"
                    >
                        {COLUMNS.map((col, index) => (
                            <div data-slot="footer-column" key={col.title} style={stagger(index + 1)} className={ENTER}>
                                <FooterAnchor
                                    href={col.href}
                                    className="text-sm font-semibold text-foreground transition-colors duration-150 hover:text-muted-foreground"
                                >
                                    {col.title}
                                </FooterAnchor>
                                <ul className="mt-3 space-y-2.5">
                                    {col.links.slice(0, MAX_LINKS).map((link) => (
                                        <li key={link.label}>
                                            <FooterAnchor
                                                href={link.href}
                                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                {link.label}
                                            </FooterAnchor>
                                        </li>
                                    ))}
                                    {col.links.length > MAX_LINKS && (
                                        <li>
                                            <FooterAnchor
                                                href={col.href}
                                                className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                Alles bekijken
                                                <ArrowRight className="size-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                                            </FooterAnchor>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                <div
                    data-slot="footer-meta"
                    style={stagger(4)}
                    className={cn(
                        ENTER,
                        'relative mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6',
                        'sm:flex-row sm:items-center',
                    )}
                >
                    <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Shiftly. Alle rechten voorbehouden.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                            Inloggen
                        </Link>
                        <Link
                            href="/register"
                            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Registreren
                        </Link>
                        <a href="#functies" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                            Functies
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer02;
