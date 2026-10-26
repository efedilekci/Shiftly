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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useRef, useState } from 'react';

type Candidate = {
    id: number;
    name: string;
    email: string | null;
    role_label: string;
};

export default function TransferOwnershipDialog({
    companySlug,
    candidates,
}: {
    companySlug: string;
    candidates: Candidate[];
}) {
    const [open, setOpen] = useState(false);
    const cancelButton = useRef<HTMLButtonElement>(null);
    const { data, setData, patch, processing, errors, reset } = useForm({
        member_id: candidates[0] ? String(candidates[0].id) : '',
    });

    const selected = candidates.find((candidate) => String(candidate.id) === data.member_id);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        if (processing || !data.member_id) return;

        patch(route('company.settings.transfer-ownership', companySlug), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!processing) {
                    if (nextOpen) {
                        setData('member_id', candidates[0] ? String(candidates[0].id) : '');
                    }
                    setOpen(nextOpen);
                }
            }}
        >
            <DialogTrigger render={<Button type="button" variant="outline" disabled={candidates.length === 0} />}>
                Eigendom overdragen
            </DialogTrigger>
            <DialogContent initialFocus={cancelButton} className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Eigendom overdragen</DialogTitle>
                    <DialogDescription>
                        Kies wie het bedrijf overneemt. Je wordt daarna teamleider en kunt het bedrijf verlaten als je
                        wilt.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4 pt-2" aria-busy={processing}>
                    <div className="grid gap-2">
                        <Label>Nieuwe eigenaar</Label>
                        <Select value={data.member_id} onValueChange={(value) => setData('member_id', value)}>
                            <SelectTrigger aria-label="Nieuwe eigenaar">
                                <SelectValue placeholder="Kies een medewerker" />
                            </SelectTrigger>
                            <SelectContent>
                                {candidates.map((candidate) => (
                                    <SelectItem key={candidate.id} value={String(candidate.id)}>
                                        {candidate.name} · {candidate.role_label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.member_id} />
                        {selected?.email && (
                            <p className="text-muted-foreground text-xs tabular-nums">{selected.email}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose render={<Button ref={cancelButton} type="button" variant="outline" disabled={processing} />}>
                            Annuleren
                        </DialogClose>
                        <Button type="submit" variant="destructive" disabled={!data.member_id || processing}>
                            {processing ? 'Overdragen...' : 'Overdragen'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
