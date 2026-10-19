import AeroShards from '@/components/backgrounds/AeroShards';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

function useIsDarkMode(): boolean {
    const [isDark, setIsDark] = useState(() =>
        typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false,
    );

    useEffect(() => {
        const root = document.documentElement;
        const sync = () => setIsDark(root.classList.contains('dark'));
        sync();

        const observer = new MutationObserver(sync);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    return isDark;
}

function WelcomeFallbackBackground() {
    return (
        <>
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(0_0_0_/_0.06),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgb(255_255_255_/_0.08),transparent_55%)]"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                    backgroundSize: '4.5rem 4.5rem',
                    color: 'color-mix(in oklab, var(--foreground) 8%, transparent)',
                    maskImage: 'linear-gradient(to bottom, black 35%, transparent 92%)',
                }}
            />
        </>
    );
}

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const isDark = useIsDarkMode();
    const [gpuFailed, setGpuFailed] = useState(false);
    const primaryHref = route(auth.user ? 'dashboard' : 'register');
    const secondaryHref = route(auth.user ? 'dashboard' : 'login');

    return (
        <>
            <Head title="Shiftly" />
            <div className="bg-background text-foreground relative min-h-screen overflow-hidden">
                <div aria-hidden className="absolute inset-0">
                    {gpuFailed ? (
                        <WelcomeFallbackBackground />
                    ) : (
                        <AeroShards
                            className="h-full min-h-screen w-full"
                            shardColor={isDark ? '#E5E5E5' : '#404040'}
                            accentColor={isDark ? '#FFFFFF' : '#0A0A0A'}
                            backgroundColor={isDark ? '#0A0A0A' : '#FAFAFA'}
                            lightMode={!isDark}
                            placement="full"
                            material="glass"
                            markers="plus"
                            count={900}
                            depthOfField={0.55}
                            vignette={0.22}
                            glow={isDark ? 0.55 : 0.2}
                            grain={0.04}
                            mouseInteraction
                            pulseOnClick
                            holdToGather
                            onError={(error) => {
                                console.error('[AeroShards]', error);
                                setGpuFailed(true);
                            }}
                        />
                    )}
                </div>

                <div aria-hidden className="from-background/70 via-background/25 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent md:via-background/10 md:to-transparent" />

                <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-end px-5 py-6 sm:px-10">
                    <Link
                        href={secondaryHref}
                        className="text-sm font-medium underline-offset-4 transition-opacity hover:underline hover:opacity-80"
                    >
                        {auth.user ? 'Dashboard' : 'Inloggen'}
                    </Link>
                </header>

                <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center px-5 pb-16 sm:px-10 sm:pb-24">
                    <div className="max-w-3xl space-y-8">
                        <p className="font-display animate-in fade-in slide-in-from-bottom-2 fill-mode-both text-6xl leading-none font-extrabold tracking-tight sm:text-8xl md:text-9xl">
                            Shiftly
                        </p>
                        <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both space-y-4 delay-100">
                            <h1 className="font-display max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
                                Jouw tijd. Helder in beeld.
                            </h1>
                            <p className="text-muted-foreground max-w-md text-base leading-relaxed sm:text-lg">
                                Houd banen, uren en verdiensten bij — van inklokken tot maandoverzicht.
                            </p>
                        </div>
                        <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both delay-200">
                            <Link
                                href={primaryHref}
                                className="bg-primary text-primary-foreground inline-flex min-h-12 items-center gap-3 rounded-xl px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
                            >
                                {auth.user ? 'Naar je dashboard' : 'Maak je account aan'}
                                <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
