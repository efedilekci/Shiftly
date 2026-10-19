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
import { type HourEntry } from '@/types/hour-entry';
import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { type FormEventHandler, useRef, useState } from 'react';

const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function DeleteHourEntryDialog({ entry }: { entry: HourEntry }) {
    const [open, setOpen] = useState(false);
    const cancelButton = useRef<HTMLButtonElement>(null);
    const { delete: destroy, processing } = useForm({});
    const [year, month, day] = entry.work_date.split('-').map(Number);
    const date = dateFormat.format(new Date(year, month - 1, day));

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (processing) return;
        destroy(route('uren.destroy', entry.id), {
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
            <DialogTrigger render={<Button type="button" variant="ghost" size="icon" />} aria-label={`Uren verwijderen: ${entry.baan_name}, ${date}`}>
                <Trash2 aria-hidden="true" />
            </DialogTrigger>
            <DialogContent initialFocus={cancelButton} className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Uren verwijderen</DialogTitle>
                    <DialogDescription className="break-words">
                        Wil je de registratie voor &ldquo;{entry.baan_name}&rdquo; op {date} van {entry.start_time} tot {entry.end_time} verwijderen?
                        Dit kan niet ongedaan worden gemaakt.
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
