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
import { type Baan } from '@/types/baan';
import { type HourEntry } from '@/types/hour-entry';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { type FormEventHandler, useId, useRef, useState } from 'react';

export default function HourEntryDialog({
    banen,
    today,
    entry,
    defaultOpen = false,
    showTrigger = true,
}: {
    banen: Baan[];
    today: string;
    entry?: HourEntry;
    defaultOpen?: boolean;
    showTrigger?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const fieldId = useId();
    const baanInput = useRef<HTMLSelectElement>(null);
    const form = useRef<HTMLFormElement>(null);
    const initialData = {
        baan_id: entry ? String(entry.baan_id ?? '') : banen.length === 1 ? String(banen[0].id) : '',
        work_date: entry?.work_date ?? today,
        start_time: entry?.start_time ?? '',
        end_time: entry?.end_time ?? '',
        break_minutes: String(entry?.break_minutes ?? 0),
        note: entry?.note ?? '',
    };
    const { data, setData, submit: send, errors, processing, reset, clearErrors } = useForm(initialData);
    const overnight = data.start_time !== '' && data.end_time !== '' && data.end_time < data.start_time;
    const duration = (() => {
        if (
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.start_time) ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.end_time) ||
            !/^\d+$/.test(data.break_minutes)
        )
            return null;
        const [startHour, startMinute] = data.start_time.split(':').map(Number);
        const [endHour, endMinute] = data.end_time.split(':').map(Number);
        let minutes = endHour * 60 + endMinute - startHour * 60 - startMinute;
        if (minutes < 0) minutes += 1440;
        minutes -= Number(data.break_minutes);
        return minutes > 0 ? minutes : null;
    })();
    const clearEditQuery = () => {
        if (!defaultOpen || !entry) {
            return;
        }

        router.get(route('uren.index'), {}, { replace: true, preserveState: true, preserveScroll: true });
    };
    const changeOpen = (nextOpen: boolean) => {
        if (processing) return;
        if (nextOpen) {
            setData(initialData);
            clearErrors();
        }
        setOpen(nextOpen);
        if (!nextOpen) {
            clearEditQuery();
        }
    };
    const handleSubmit: FormEventHandler = (event) => {
        event.preventDefault();
        if (processing) return;
        send(entry ? 'put' : 'post', entry ? route('uren.update', entry.id) : route('uren.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
                clearEditQuery();
            },
            onError: (validationErrors) => {
                const field = ['baan_id', 'work_date', 'start_time', 'end_time', 'break_minutes', 'note'].find((key) => validationErrors[key]);
                if (field) (form.current?.elements.namedItem(field) as HTMLElement | null)?.focus();
            },
        });
    };
    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            {showTrigger ? (
                entry ? (
                    <DialogTrigger
                        render={<Button type="button" variant="ghost" size="icon" />}
                        aria-label={`Uren wijzigen: ${entry.baan_name}, ${entry.work_date}`}
                    >
                        <Pencil aria-hidden="true" />
                    </DialogTrigger>
                ) : (
                    <DialogTrigger render={<Button disabled={banen.length === 0} />}>
                        <Plus aria-hidden="true" />
                        Uren toevoegen
                    </DialogTrigger>
                )
            ) : null}
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg" initialFocus={baanInput}>
                <DialogHeader>
                    <DialogTitle>{entry ? 'Uren wijzigen' : 'Uren toevoegen'}</DialogTitle>
                    <DialogDescription className="sr-only">Registreer een dienst met begin- en eindtijd, pauze en optionele notitie.</DialogDescription>
                </DialogHeader>
                <form ref={form} onSubmit={handleSubmit} className="grid gap-5 pt-2" aria-busy={processing}>
                    <div className="grid gap-2">
                        <Label htmlFor={`${fieldId}-baan`}>Baan</Label>
                        <select
                            ref={baanInput}
                            id={`${fieldId}-baan`}
                            name="baan_id"
                            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm disabled:opacity-50"
                            required={!entry || entry.baan_id !== null}
                            value={data.baan_id}
                            onChange={(event) => setData('baan_id', event.target.value)}
                            disabled={processing}
                            aria-invalid={!!errors.baan_id}
                            aria-describedby={errors.baan_id ? `${fieldId}-baan-error` : undefined}
                        >
                            {entry && entry.baan_id === null ? (
                                <option value="">{entry.baan_name} (verwijderd)</option>
                            ) : (
                                <option value="" disabled>
                                    Kies een baan
                                </option>
                            )}
                            {banen.map((baan) => (
                                <option key={baan.id} value={baan.id}>
                                    {entry?.baan_id === baan.id ? entry.baan_name : baan.name}
                                </option>
                            ))}
                        </select>
                        <InputError id={`${fieldId}-baan-error`} message={errors.baan_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${fieldId}-date`}>Datum</Label>
                        <Input
                            id={`${fieldId}-date`}
                            name="work_date"
                            type="date"
                            required
                            value={data.work_date}
                            onChange={(event) => setData('work_date', event.target.value)}
                            disabled={processing}
                            aria-invalid={!!errors.work_date}
                            aria-describedby={errors.work_date ? `${fieldId}-date-error` : undefined}
                        />
                        <InputError id={`${fieldId}-date-error`} message={errors.work_date} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid content-start gap-2">
                            <Label htmlFor={`${fieldId}-start`}>Begintijd</Label>
                            <Input
                                id={`${fieldId}-start`}
                                name="start_time"
                                type="time"
                                required
                                value={data.start_time}
                                onChange={(event) => setData('start_time', event.target.value)}
                                disabled={processing}
                                aria-invalid={!!errors.start_time}
                                aria-describedby={errors.start_time ? `${fieldId}-start-error` : undefined}
                            />
                            <InputError id={`${fieldId}-start-error`} message={errors.start_time} />
                        </div>
                        <div className="grid content-start gap-2">
                            <Label htmlFor={`${fieldId}-end`}>Eindtijd</Label>
                            <Input
                                id={`${fieldId}-end`}
                                name="end_time"
                                type="time"
                                required
                                value={data.end_time}
                                onChange={(event) => setData('end_time', event.target.value)}
                                disabled={processing}
                                aria-invalid={!!errors.end_time}
                                aria-describedby={errors.end_time ? `${fieldId}-end-error` : undefined}
                            />
                            <InputError id={`${fieldId}-end-error`} message={errors.end_time} />
                        </div>
                    </div>
                    {overnight && <p className="text-muted-foreground text-sm">De eindtijd valt op de volgende dag.</p>}
                    <div className="grid gap-2">
                        <Label htmlFor={`${fieldId}-break`}>Pauze in minuten</Label>
                        <Input
                            id={`${fieldId}-break`}
                            name="break_minutes"
                            type="number"
                            min={0}
                            max={1439}
                            step={1}
                            required
                            value={data.break_minutes}
                            onChange={(event) => setData('break_minutes', event.target.value)}
                            disabled={processing}
                            aria-invalid={!!errors.break_minutes}
                            aria-describedby={errors.break_minutes ? `${fieldId}-break-error` : undefined}
                        />
                        <InputError id={`${fieldId}-break-error`} message={errors.break_minutes} />
                    </div>
                    {duration !== null && (
                        <p className="text-sm" role="status">
                            Gewerkt: {Math.floor(duration / 60)}u {String(duration % 60).padStart(2, '0')}m
                        </p>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor={`${fieldId}-note`}>Notitie (optioneel)</Label>
                        <textarea
                            id={`${fieldId}-note`}
                            name="note"
                            rows={3}
                            maxLength={500}
                            value={data.note}
                            onChange={(event) => setData('note', event.target.value)}
                            disabled={processing}
                            placeholder="Bijv. drukke avond, feestdag..."
                            className="border-input bg-background placeholder:text-muted-foreground flex min-h-20 w-full rounded-md border px-3 py-2 text-base disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            aria-invalid={!!errors.note}
                            aria-describedby={errors.note ? `${fieldId}-note-error` : `${fieldId}-note-hint`}
                        />
                        <p id={`${fieldId}-note-hint`} className="text-muted-foreground text-xs tabular-nums">
                            {data.note.length}/500
                        </p>
                        <InputError id={`${fieldId}-note-error`} message={errors.note} />
                    </div>
                    <DialogFooter>
                        <DialogClose render={<Button type="button" variant="outline" disabled={processing} />}>Annuleren</DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Opslaan...' : 'Opslaan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
