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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

type RoleOption = { value: string; label: string };

export default function InviteMemberDialog({
    companySlug,
    inviteRoles,
}: {
    companySlug: string;
    inviteRoles: RoleOption[];
}) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(inviteRoles[0]?.value ?? 'employee');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; role?: string }>({});
    const canChooseRole = inviteRoles.length > 1;

    const changeOpen = (nextOpen: boolean) => {
        if (processing) return;
        if (nextOpen) {
            setEmail('');
            setRole(inviteRoles[0]?.value ?? 'employee');
            setErrors({});
        }
        setOpen(nextOpen);
    };

    const invite = () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || processing) return;

        setProcessing(true);
        setErrors({});

        router.post(
            route('company.invitations.store', companySlug),
            { email: trimmed, role },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    setEmail('');
                },
                onError: (validationErrors) => {
                    setErrors({
                        email: validationErrors.email,
                        role: validationErrors.role,
                    });
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger render={<Button type="button" />}>
                <Plus aria-hidden="true" />
                Medewerker uitnodigen
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Medewerker uitnodigen</DialogTitle>
                    <DialogDescription>
                        Zoek op e-mailadres. De uitnodiging verschijnt in de inbox van dat account op Shiftly.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 pt-2">
                    <div className="grid gap-2">
                        <Label htmlFor="invite-email">E-mailadres</Label>
                        <div className="relative">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                id="invite-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="naam@bedrijf.nl"
                                className="pl-9"
                                autoFocus
                                autoComplete="off"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        invite();
                                    }
                                }}
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {canChooseRole ? (
                        <div className="grid gap-2">
                            <Label>Rol</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger aria-label="Rol bij uitnodigen">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {inviteRoles.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.role} />
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            Uitnodiging als {inviteRoles[0]?.label?.toLowerCase() ?? 'medewerker'}.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose render={<Button type="button" variant="outline" disabled={processing} />}>Annuleren</DialogClose>
                    <Button type="button" disabled={!email.trim() || processing} onClick={invite}>
                        Uitnodigen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
