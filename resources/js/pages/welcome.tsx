import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welkom" />
            <main className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-lg space-y-6">
                    <p className="text-sm font-semibold tracking-widest uppercase">Shiftly</p>
                    <h1 className="text-4xl font-semibold tracking-tight">Grip op je werkuren.</h1>
                    <p className="text-muted-foreground text-lg">
                        Je eigen plek voor gewerkte uren, banen en verdiensten. We bouwen Shiftly stap voor stap.
                    </p>
                    <nav className="flex flex-wrap gap-3" aria-label="Account">
                        {auth.user ? (
                            <Link href={route('dashboard')} className="bg-primary text-primary-foreground rounded-md px-5 py-3 font-medium">
                                Naar dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={route('register')} className="bg-primary text-primary-foreground rounded-md px-5 py-3 font-medium">
                                    Account aanmaken
                                </Link>
                                <Link href={route('login')} className="rounded-md border px-5 py-3 font-medium">
                                    Inloggen
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </main>
        </>
    );
}
