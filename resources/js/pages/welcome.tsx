import AeroShards from '@/components/backgrounds/AeroShards';
import CardNav, { type CardNavItem } from '@/components/CardNav';
import MagicBento, { type MagicBentoItem } from '@/components/MagicBento';
import Footer02 from '@/components/ui/footer-02';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const featureItems: MagicBentoItem[] = [
    {
        label: 'Klok',
        title: 'In- en uitklokken',
        description: 'Start je dienst met één tik en stop wanneer je klaar bent, met pauze en notitie.',
        visual: 'automation',
        colSpan: 2,
        rowSpan: 2,
    },
    {
        label: 'Uren',
        title: 'Alles op één plek',
        description: 'Filter, zoek en exporteer je registraties naar CSV.',
        visual: 'dashboard',
    },
    {
        label: 'Banen',
        title: 'Persoonlijk en zakelijk',
        description: 'Eigen banen naast een bedrijfsbaan, elk met eigen uurloon.',
        visual: 'collaboration',
    },
    {
        label: 'Team',
        title: 'Bedrijf starten',
        description: 'Maak een team aan, nodig collega\'s uit en werk in hetzelfde overzicht.',
        visual: 'integration',
    },
    {
        label: 'Goedkeuring',
        title: 'Uren afstemmen',
        description: 'Laat uren direct meetellen of keur ze eerst goed als eigenaar of teamleider.',
        visual: 'security',
    },
    {
        label: 'Inzicht',
        title: 'Maandoverzicht',
        description: 'Zie gewerkte uren, verdiensten en trends in één oogopslag.',
        visual: 'analytics',
        colSpan: 2,
        rowSpan: 2,
    },
    {
        label: 'Herinnering',
        title: 'Open-klok alert',
        description: 'Stel zelf in wanneer je een seintje krijgt dat je nog ingeklokt bent.',
        visual: 'security',
    },
    {
        label: 'Export',
        title: 'CSV-export',
        description: 'Deel of archiveer je uren wanneer jij dat wilt.',
        visual: 'integration',
    },
];

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
    const navItems = useMemo<CardNavItem[]>(
        () => [
            {
                label: 'Ontdekken',
                description: 'Bekijk wat Shiftly voor je doet.',
                links: [
                    { label: 'Functies', href: '#functies' },
                    { label: 'Voor teams', href: '#teams' },
                ],
            },
            {
                label: 'App',
                description: auth.user ? 'Direct verder in Shiftly.' : 'Log in of maak een account.',
                links: auth.user
                    ? [
                          { label: 'Dashboard', href: route('dashboard') },
                          { label: 'Klok', href: route('clock.index') },
                          { label: 'Uren', href: route('uren.index') },
                      ]
                    : [
                          { label: 'Inloggen', href: route('login') },
                          { label: 'Registreren', href: route('register') },
                      ],
            },
            {
                label: 'Meer',
                description: 'Banen en voorkeuren.',
                links: auth.user
                    ? [
                          { label: 'Banen', href: route('banen.index') },
                          { label: 'Bedrijf starten', href: route('company.create') },
                          { label: 'Klokinstellingen', href: route('clock-preferences.edit') },
                      ]
                    : [
                          { label: 'Beginnen', href: route('register') },
                          { label: 'Inloggen', href: route('login') },
                      ],
            },
        ],
        [auth.user],
    );

    return (
        <>
            <Head title="Shiftly" />
            <div className="bg-background text-foreground">
                <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
                    <div className="pointer-events-auto">
                        <CardNav
                            logo={<span className="font-display text-lg font-extrabold tracking-tight">Shiftly</span>}
                            logoAlt="Shiftly"
                            logoHref="/"
                            items={navItems}
                            cta={{
                                label: auth.user ? 'Dashboard' : 'Start gratis',
                                href: primaryHref,
                            }}
                            theme={isDark ? 'dark' : 'light'}
                            surface={isDark ? 'solid' : 'glass'}
                            menuLabel
                            linkComponent={Link}
                            ariaLabel="Hoofdnavigatie"
                            className="max-w-6xl"
                        />
                    </div>
                </div>

                <section className="relative isolate min-h-dvh overflow-hidden">
                    <div aria-hidden className="absolute inset-0">
                        {gpuFailed ? (
                            <WelcomeFallbackBackground />
                        ) : (
                            <AeroShards
                                className="h-full w-full"
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

                    <div
                        aria-hidden
                        className="from-background/70 via-background/25 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent md:via-background/10 md:to-transparent"
                    />

                    <main className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-5 pt-28 pb-16 sm:px-10 sm:pt-32 sm:pb-24">
                        <div className="max-w-3xl space-y-8">
                            <p className="font-display animate-in fade-in slide-in-from-bottom-2 fill-mode-both text-6xl leading-none font-extrabold tracking-tight sm:text-8xl md:text-9xl">
                                Shiftly
                            </p>
                            <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both space-y-4 delay-100">
                                <h1 className="font-display max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
                                    Jouw tijd. Helder in beeld.
                                </h1>
                                <p className="text-muted-foreground max-w-lg text-base leading-relaxed sm:text-lg">
                                    Voor jezelf of met je team: banen, uren en verdiensten op één plek, van inklokken tot
                                    maandoverzicht en bedrijfsgoedkeuring.
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
                </section>

                <section id="functies" className="bg-background relative z-10 scroll-mt-28 border-t">
                    <div className="mx-auto max-w-6xl space-y-10 px-5 py-20 sm:px-10 sm:py-28">
                        <div className="space-y-4">
                            <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                                Alles wat je nodig hebt.
                            </h2>
                            <p className="text-muted-foreground max-w-xl text-base leading-relaxed sm:text-lg">
                                Van inklokken tot export — voor bijbanen, zzp en kleine teams die samen uren willen bijhouden.
                            </p>
                        </div>

                        <MagicBento
                            items={featureItems}
                            theme={isDark ? 'dark' : 'light'}
                            glowColor={isDark ? '#FAFAFA' : '#0A0A0A'}
                            enableBorderGlow
                            enableSpotlight
                            enableStars
                            clickEffect
                            textAutoHide={false}
                            className="w-full"
                        />
                    </div>
                </section>

                <section id="teams" className="bg-background relative z-10 scroll-mt-28 border-t">
                    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-10 sm:py-28">
                        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                            <div className="space-y-4">
                                <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Ook voor kleine bedrijven
                                </h2>
                                <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
                                    Start een bedrijf in Shiftly, nodig medewerkers uit die al een account hebben en houd
                                    teamuren overzichtelijk. Rollen, goedkeuring en instellingen blijven bij de eigenaar.
                                </p>
                            </div>
                            <ul className="space-y-4 text-sm sm:text-base">
                                <li className="border-border rounded-xl border px-4 py-3">
                                    <span className="font-medium">Uitnodigen</span>
                                    <span className="text-muted-foreground block mt-1">
                                        Collega&apos;s met een Shiftly-account kunnen direct meedoen via de inbox.
                                    </span>
                                </li>
                                <li className="border-border rounded-xl border px-4 py-3">
                                    <span className="font-medium">Bedrijfsdashboard</span>
                                    <span className="text-muted-foreground block mt-1">
                                        Zie uren van het team, keur registraties goed en exporteer waar nodig.
                                    </span>
                                </li>
                                <li className="border-border rounded-xl border px-4 py-3">
                                    <span className="font-medium">Eigendom</span>
                                    <span className="text-muted-foreground block mt-1">
                                        Draag het bedrijf over of hef het op wanneer je team verandert.
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div className="mt-10">
                            <Link
                                href={auth.user ? route('company.create') : route('register')}
                                className="border-border hover:bg-muted/50 inline-flex min-h-11 items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors"
                            >
                                {auth.user ? 'Bedrijf starten' : 'Account aanmaken en team opzetten'}
                                <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="bg-background relative z-10">
                    <Footer02 />
                </div>
            </div>
        </>
    );
}
