import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="bg-background text-foreground relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6 md:p-10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(0_0_0_/_0.05),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgb(255_255_255_/_0.07),transparent_55%)]"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                    backgroundSize: '4.5rem 4.5rem',
                    color: 'color-mix(in oklab, var(--foreground) 8%, transparent)',
                    maskImage: 'linear-gradient(to bottom, black 30%, transparent 90%)',
                }}
            />

            <div className="relative z-10 w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-5">
                        <Link href={route('home')} className="group flex flex-col items-center gap-3 transition-opacity hover:opacity-80">
                            <div className="bg-foreground text-background flex size-11 items-center justify-center rounded-xl">
                                <AppLogoIcon className="size-5" />
                            </div>
                            <span className="font-display text-3xl leading-none font-extrabold tracking-tight">Shiftly</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
                            {description ? <p className="text-muted-foreground text-center text-sm leading-relaxed">{description}</p> : null}
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
