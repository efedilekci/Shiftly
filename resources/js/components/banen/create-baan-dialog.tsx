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
import { Plus } from 'lucide-react';
import { type FormEventHandler, useRef, useState } from 'react';

export default function CreateBaanDialog() {
    const [open, setOpen] = useState(false);
    const nameInput = useRef<HTMLInputElement>(null);
    const wageInput = useRef<HTMLInputElement>(null);
    const { data, setData, post, errors, processing, reset, clearErrors } = useForm({ name: '', hourly_wage: '' });

    const changeOpen = (nextOpen: boolean) => {
        if (processing) return;
        if (nextOpen) {
            reset();
            clearErrors();
        }
        setOpen(nextOpen);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (processing) return;
        post(route('banen.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
            },
            onError: (validationErrors) => {
                if (validationErrors.name) nameInput.current?.focus();
                else wageInput.current?.focus();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger render={<Button />}>
                <Plus aria-hidden="true" />
                Baan toevoegen
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto" initialFocus={nameInput}>
                <DialogHeader>
                    <DialogTitle>Baan toevoegen</DialogTitle>
                    <DialogDescription className="sr-only">Vul de naam en het uurloon van je baan in.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-6 pt-2" aria-busy={processing}>
                    <div className="grid gap-2">
                        <Label htmlFor="baan-name">Naam</Label>
                        <Input
                            ref={nameInput}
                            id="baan-name"
                            name="name"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            required
                            maxLength={255}
                            autoComplete="off"
                            disabled={processing}
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? 'baan-name-error' : undefined}
                        />
                        <InputError id="baan-name-error" message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="baan-hourly-wage">Uurloon in euro</Label>
                        <Input
                            ref={wageInput}
                            id="baan-hourly-wage"
                            name="hourly_wage"
                            inputMode="decimal"
                            value={data.hourly_wage}
                            onChange={(event) => setData('hourly_wage', event.target.value)}
                            required
                            maxLength={12}
                            placeholder="15,00"
                            disabled={processing}
                            aria-invalid={!!errors.hourly_wage}
                            aria-describedby={errors.hourly_wage ? 'baan-wage-error' : undefined}
                        />
                        <InputError id="baan-wage-error" message={errors.hourly_wage} />
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
