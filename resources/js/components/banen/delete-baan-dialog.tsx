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
import { type Baan } from '@/types/baan';
import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { type FormEventHandler, useRef, useState } from 'react';

export default function DeleteBaanDialog({ baan }: { baan: Baan }) {
    const [open, setOpen] = useState(false);
    const cancelButton = useRef<HTMLButtonElement>(null);
    const { delete: destroy, processing } = useForm({});

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (processing) return;
        destroy(route('banen.destroy', baan.id), {
            preserveScroll: true,
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
            <DialogTrigger render={<Button type="button" variant="ghost" size="icon" />} aria-label={`Baan verwijderen: ${baan.name}`}>
                <Trash2 aria-hidden="true" />
            </DialogTrigger>
            <DialogContent initialFocus={cancelButton} className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Baan verwijderen</DialogTitle>
                    <DialogDescription className="break-words">
                        Weet je zeker dat je &ldquo;{baan.name}&rdquo; wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
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
