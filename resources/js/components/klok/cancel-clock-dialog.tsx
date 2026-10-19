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

export default function CancelClockDialog() {
    const [open, setOpen] = useState(false);
    const backButton = useRef<HTMLButtonElement>(null);
    const { delete: destroy, processing } = useForm({});
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (processing) return;
        destroy(route('clock.cancel'), { preserveScroll: true, onSuccess: () => setOpen(false) });
    };
    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!processing) setOpen(nextOpen);
            }}
        >
            <DialogTrigger render={<Button variant="outline" />}>Dienst annuleren</DialogTrigger>
            <DialogContent initialFocus={backButton}>
                <DialogHeader>
                    <DialogTitle>Dienst annuleren</DialogTitle>
                    <DialogDescription>Wil je de actieve dienst annuleren? De gewerkte tijd wordt dan niet opgeslagen.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} aria-busy={processing}>
                    <DialogFooter>
                        <DialogClose render={<Button ref={backButton} type="button" variant="outline" disabled={processing} />}>Terug</DialogClose>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            {processing ? 'Annuleren...' : 'Dienst annuleren'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
