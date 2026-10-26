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
import { type FormEventHandler, useRef, useState } from 'react';

export default function DestroyCompanyDialog({
    companySlug,
    companyName,
}: {
    companySlug: string;
    companyName: string;
}) {
    const [open, setOpen] = useState(false);
    const cancelButton = useRef<HTMLButtonElement>(null);
    const { data, setData, delete: destroy, errors, processing, reset } = useForm({
        confirmation: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (processing) return;

        destroy(route('company.settings.destroy', companySlug), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    const confirmed = data.confirmation === companyName;

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!processing) {
                    setOpen(nextOpen);
                    if (!nextOpen) reset();
                }
            }}
        >
            <DialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>Bedrijf opheffen</DialogTrigger>
            <DialogContent initialFocus={cancelButton} className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Bedrijf opheffen</DialogTitle>
                    <DialogDescription className="break-words">
                        Dit verwijdert &ldquo;{companyName}&rdquo; voor iedereen. Bedrijfsbanen verdwijnen; geregistreerde uren
                        blijven bij de medewerkers staan. Dit kan niet ongedaan worden gemaakt.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4" aria-busy={processing}>
                    <div className="grid gap-2">
                        <Label htmlFor="destroy-company-confirmation">
                            Typ <span className="font-medium">{companyName}</span> om te bevestigen
                        </Label>
                        <Input
                            id="destroy-company-confirmation"
                            type="text"
                            value={data.confirmation}
                            onChange={(event) => setData('confirmation', event.target.value)}
                            disabled={processing}
                            autoComplete="off"
                            aria-invalid={!!errors.confirmation}
                        />
                        <InputError message={errors.confirmation} />
                    </div>
                    <DialogFooter>
                        <DialogClose render={<Button ref={cancelButton} type="button" variant="outline" disabled={processing} />}>
                            Annuleren
                        </DialogClose>
                        <Button type="submit" variant="destructive" disabled={processing || !confirmed}>
                            {processing ? 'Opheffen...' : 'Definitief opheffen'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
