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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useId, useRef, useState } from 'react';

type StopClockForm = { break_minutes: string; redirect?: string; clock?: string };

export default function StopClockDialog({ redirect }: { redirect?: 'dashboard' | 'clock.index' }) {
    const [open, setOpen] = useState(false);
    const pauseInput = useRef<HTMLInputElement>(null);
    const fieldId = useId();
    const { data, setData, post, processing, errors, clearErrors } = useForm<StopClockForm>({
        break_minutes: '0',
        ...(redirect ? { redirect } : {}),
    });
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (processing) return;
        post(route('clock.stop'), { preserveScroll: true, onSuccess: () => setOpen(false), onError: () => pauseInput.current?.focus() });
    };
    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (processing) return;
                if (nextOpen) {
                    clearErrors();
                    setData({ break_minutes: '0', ...(redirect ? { redirect } : {}) });
                }
                setOpen(nextOpen);
            }}
        >
            <DialogTrigger render={<Button />}>Uitklokken</DialogTrigger>
            <DialogContent initialFocus={pauseInput}>
                <DialogHeader>
                    <DialogTitle>Uitklokken</DialogTitle>
                    <DialogDescription>Vul je pauze in. De gewerkte tijd wordt in hele minuten opgeslagen.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-5 pt-2" aria-busy={processing}>
                    <div className="grid gap-2">
                        <Label htmlFor={fieldId}>Pauze in minuten</Label>
                        <Input
                            ref={pauseInput}
                            id={fieldId}
                            type="number"
                            min={0}
                            max={1439}
                            step={1}
                            required
                            value={data.break_minutes}
                            onChange={(event) => setData('break_minutes', event.target.value)}
                            disabled={processing}
                            aria-invalid={!!errors.break_minutes}
                            aria-describedby={errors.break_minutes ? `${fieldId}-error` : undefined}
                        />
                        <InputError id={`${fieldId}-error`} message={errors.break_minutes} />
                        <InputError message={errors.clock} />
                    </div>
                    <DialogFooter>
                        <DialogClose render={<Button type="button" variant="outline" disabled={processing} />}>Terug</DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Opslaan...' : 'Uitklokken'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
