import InputError from '@/components/input-error';
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
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useId, useRef, useState } from 'react';

export default function RejectHourEntryDialog({
    companySlug,
    entryId,
    employeeName,
    workDate,
}: {
    companySlug: string;
    entryId: number;
    employeeName: string;
    workDate: string;
}) {
    const [open, setOpen] = useState(false);
    const fieldId = useId();
    const reasonInput = useRef<HTMLTextAreaElement>(null);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        reason: '',
    });

    const changeOpen = (nextOpen: boolean) => {
        if (processing) {
            return;
        }

        if (nextOpen) {
            reset();
            clearErrors();
        }

        setOpen(nextOpen);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (processing) {
            return;
        }

        post(route('company.hours.reject', [companySlug, entryId]), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
            },
            onError: () => {
                reasonInput.current?.focus();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>Afwijzen</DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md" initialFocus={reasonInput}>
                <DialogHeader>
                    <DialogTitle>Uren afwijzen</DialogTitle>
                    <DialogDescription>
                        Wijs de uren van {employeeName} op {workDate} af. De medewerker krijgt een melding in de inbox.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4" aria-busy={processing}>
                    <div className="grid gap-2">
                        <Label htmlFor={`${fieldId}-reason`}>Reden (optioneel)</Label>
                        <textarea
                            ref={reasonInput}
                            id={`${fieldId}-reason`}
                            name="reason"
                            rows={3}
                            maxLength={500}
                            value={data.reason}
                            onChange={(event) => setData('reason', event.target.value)}
                            disabled={processing}
                            placeholder="Bijv. pauze klopt niet, tijden controleren..."
                            className="border-input bg-background placeholder:text-muted-foreground flex min-h-20 w-full rounded-md border px-3 py-2 text-base disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            aria-invalid={!!errors.reason}
                            aria-describedby={errors.reason ? `${fieldId}-reason-error` : `${fieldId}-reason-hint`}
                        />
                        <p id={`${fieldId}-reason-hint`} className="text-muted-foreground text-xs tabular-nums">
                            {data.reason.length}/500
                        </p>
                        <InputError id={`${fieldId}-reason-error`} message={errors.reason} />
                    </div>
                    <DialogFooter>
                        <DialogClose render={<Button type="button" variant="outline" disabled={processing} />}>
                            Annuleren
                        </DialogClose>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            {processing ? 'Afwijzen...' : 'Afwijzen'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
