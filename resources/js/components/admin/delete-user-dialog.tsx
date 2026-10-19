import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/base-dialog';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useRef, useState } from 'react';

export default function DeleteAdminUserDialog({
    user,
}: {
    user: { id: number; name: string };
}) {
    const [open, setOpen] = useState(false);
    const cancelButton = useRef<HTMLButtonElement>(null);
    const { delete: destroy, processing } = useForm({});

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (processing) return;
        destroy(route('admin.users.destroy', user.id), {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!processing) setOpen(nextOpen);
            }}
        >
            <DialogTrigger render={<Button type="button" variant="destructive" />}>Gebruiker verwijderen</DialogTrigger>
            <DialogContent initialFocus={cancelButton} className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gebruiker verwijderen</DialogTitle>
                    <DialogDescription className="break-words">
                        Weet je zeker dat je &ldquo;{user.name}&rdquo; wilt verwijderen? Banen, uren en klokdata van deze gebruiker verdwijnen
                        ook. Dit kan niet ongedaan worden gemaakt.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} aria-busy={processing}>
                    <DialogFooter>
                        <DialogClose render={<Button ref={cancelButton} type="button" variant="outline" disabled={processing} />}>
                            Annuleren
                        </DialogClose>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            {processing ? 'Verwijderen...' : 'Verwijderen'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
