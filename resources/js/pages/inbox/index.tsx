import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCheck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inbox', href: '/inbox' }];

type InvitationItem = {
    kind: 'invitation';
    id: number;
    title: string;
    body: string;
    company_name: string;
    company_slug: string;
    role: string;
    role_label: string;
    invited_by: string | null;
    expires_at: string;
    is_expired: boolean;
    is_pending: boolean;
    created_at: string | null;
    is_unread: boolean;
};

type MessageItem = {
    kind: 'message';
    id: number;
    type: string;
    title: string;
    body: string;
    action_url: string | null;
    action_label: string | null;
    created_at: string | null;
    is_unread: boolean;
};

type InboxItem = InvitationItem | MessageItem;

function formatWhen(value: string | null): string {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleString('nl-NL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function InboxIndex({ items }: { items: InboxItem[]; invitations: InvitationItem[] }) {
    const { flash, errors } = usePage().props as {
        flash?: { status?: string | null };
        errors?: { invitation?: string };
    };

    const hasUnreadMessages = items.some((item) => item.kind === 'message' && item.is_unread);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inbox" />
            <div className="mx-auto w-full max-w-3xl space-y-8 px-5 py-8 sm:p-10">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Inbox</h1>
                        <p className="text-muted-foreground text-sm">
                            Uitnodigingen en meldingen over je uren.
                        </p>
                    </div>
                    {hasUnreadMessages && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.post(route('inbox.messages.read-all'))}
                        >
                            <CheckCheck className="size-4" />
                            Alles gelezen
                        </Button>
                    )}
                </header>

                {flash?.status && (
                    <div className="border-border bg-muted/40 rounded-xl border px-4 py-3 text-sm" role="status">
                        {flash.status}
                    </div>
                )}
                <InputError message={errors?.invitation} />

                <div className="space-y-3" aria-label="Inbox meldingen">
                    {items.length === 0 ? (
                        <div className="border-border text-muted-foreground rounded-xl border px-4 py-10 text-center text-sm">
                            Geen meldingen.
                        </div>
                    ) : (
                        items.map((item) =>
                            item.kind === 'invitation' ? (
                                <article
                                    key={`invitation-${item.id}`}
                                    className="border-border bg-card rounded-xl border px-4 py-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-medium">{item.title}</h2>
                                                {item.is_unread && (
                                                    <span className="bg-foreground text-background rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                                                        Nieuw
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground text-sm">{item.body}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {item.is_expired ? 'Verlopen' : 'Uitnodiging'}
                                                {item.created_at ? ` · ${formatWhen(item.created_at)}` : ''}
                                            </p>
                                        </div>
                                        {item.is_pending ? (
                                            <Button
                                                size="sm"
                                                onClick={() => router.post(route('inbox.accept', item.id))}
                                            >
                                                Accepteren
                                            </Button>
                                        ) : null}
                                    </div>
                                </article>
                            ) : (
                                <article
                                    key={`message-${item.id}`}
                                    className={`border-border rounded-xl border px-4 py-4 ${item.is_unread ? 'bg-muted/30' : 'bg-card'}`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-medium">{item.title}</h2>
                                                {item.is_unread && (
                                                    <span className="bg-foreground text-background rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                                                        Nieuw
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground text-sm">{item.body}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {formatWhen(item.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.action_url && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const open = () => router.visit(item.action_url!);

                                                        if (item.is_unread) {
                                                            router.post(route('inbox.messages.read', item.id), {}, { onSuccess: open });
                                                            return;
                                                        }

                                                        open();
                                                    }}
                                                >
                                                    {item.action_label ?? 'Openen'}
                                                </Button>
                                            )}
                                            {item.is_unread && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => router.post(route('inbox.messages.read', item.id))}
                                                >
                                                    Gelezen
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ),
                        )
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
