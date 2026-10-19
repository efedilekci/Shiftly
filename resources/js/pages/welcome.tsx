import AppLogo from '@/components/app-logo';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Clock3 } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welkom" />
            <div className="min-h-screen px-5 sm:px-10">
                <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-b py-6">
                    <Link href={route('home')} aria-label="Shiftly startpagina" className="flex items-center gap-2">
                        <AppLogo />
                    </Link>
                    <Link href={route(auth.user ? 'dashboard' : 'login')} className="hover:bg-accent rounded-lg px-4 py-2 text-sm font-medium">
                        {auth.user ? 'Dashboard' : 'Inloggen'}
                    </Link>
                </header>
                <main className="mx-auto grid max-w-6xl items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
                    <div className="space-y-7">
                        <p className="text-primary text-sm font-medium">Meer overzicht. Minder uitzoekwerk.</p>
                        <h1 className="max-w-xl text-5xl leading-[1.1] font-semibold tracking-tight sm:text-6xl">
                            Jouw tijd.
                            <br />
                            Helder in beeld.
                        </h1>
                        <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
                            Een eigen plek voor je werkuren, banen en verdiensten. Begin met je account en bouw aan meer overzicht.
                        </p>
                        <Link
                            href={route(auth.user ? 'dashboard' : 'register')}
                            className="bg-primary text-primary-foreground inline-flex min-h-12 items-center gap-4 rounded-xl px-6 py-3 font-medium hover:opacity-90"
                        >
                            {auth.user ? 'Naar je dashboard' : 'Maak je account aan'}
                            <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                    </div>
                    <section className="bg-card rounded-3xl border p-7 sm:p-10" aria-labelledby="overview-title">
                        <div className="bg-accent text-primary mb-10 flex size-14 items-center justify-center rounded-2xl">
                            <Clock3 size={28} aria-hidden="true" />
                        </div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-widest uppercase">Ruimte voor overzicht</p>
                        <h2 id="overview-title" className="text-2xl font-semibold tracking-tight">
                            Je werkdag op één plek.
                        </h2>
                        <p className="text-muted-foreground mt-4 leading-relaxed">
                            Van je eerste dienst tot het einde van de maand: overzicht van je werkuren en verdiensten.
                        </p>
                    </section>
                </main>
            </div>
        </>
    );
}
