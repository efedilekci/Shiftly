import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { filterAdminCompanies, type AdminCompanyFilters, type AdminCompanyRow } from '@/lib/admin-company-filters';
import { Link } from '@inertiajs/react';
import { useId, useMemo, useState } from 'react';

const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });

function formatDate(value: string | null): string {
    if (!value) return '-';
    const [year, month, day] = value.split('-').map(Number);

    return dateFormat.format(new Date(year, month - 1, day));
}

export default function AdminCompaniesIndex({ companies }: { companies: AdminCompanyRow[] }) {
    const fieldId = useId();
    const [filters, setFilters] = useState<AdminCompanyFilters>({ search: '' });
    const filteredCompanies = useMemo(() => filterAdminCompanies(companies, filters), [companies, filters]);
    const hasFilters = Boolean(filters.search.trim());

    return (
        <AdminLayout title="Bedrijven">
            <div className="space-y-6">
                <header>
                    <h1 className="font-display text-3xl font-semibold tracking-tight">Bedrijven</h1>
                </header>

                <div className="space-y-3">
                    <div className="grid gap-4 sm:max-w-md">
                        <div className="grid gap-2">
                            <Label htmlFor={`${fieldId}-search`}>Zoeken</Label>
                            <Input
                                id={`${fieldId}-search`}
                                value={filters.search}
                                onChange={(event) => setFilters({ search: event.target.value })}
                                placeholder="Naam, eigenaar of slug..."
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm">
                            <span className="font-semibold tabular-nums">{filteredCompanies.length}</span>
                            <span className="text-muted-foreground">
                                {' '}
                                van {companies.length} {companies.length === 1 ? 'bedrijf' : 'bedrijven'}
                            </span>
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!hasFilters}
                            onClick={() => setFilters({ search: '' })}
                        >
                            Filters wissen
                        </Button>
                    </div>
                </div>

                <div className="bg-card overflow-hidden rounded-xl border">
                    <Table aria-label="Bedrijven">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Naam</TableHead>
                                <TableHead>Eigenaar</TableHead>
                                <TableHead className="text-right">Leden</TableHead>
                                <TableHead>Goedkeuring</TableHead>
                                <TableHead>Aangemaakt</TableHead>
                                <TableHead className="w-28 text-right">
                                    <span className="sr-only">Acties</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCompanies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                                        {companies.length === 0 ? 'Nog geen bedrijven.' : 'Geen bedrijven gevonden.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCompanies.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={route('admin.companies.show', company.slug)}
                                                prefetch
                                                className="text-foreground underline underline-offset-4"
                                            >
                                                {company.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={route('admin.users.show', company.owner_id)}
                                                prefetch
                                                className="underline underline-offset-4"
                                            >
                                                {company.owner_name}
                                            </Link>
                                            {company.owner_email && (
                                                <span className="text-muted-foreground mt-0.5 block text-xs tabular-nums">
                                                    {company.owner_email}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{company.members_count}</TableCell>
                                        <TableCell className="max-w-xs [overflow-wrap:anywhere] whitespace-normal">
                                            {company.hour_approval_mode_label}
                                        </TableCell>
                                        <TableCell className="tabular-nums">{formatDate(company.created_at)}</TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={route('admin.companies.show', company.slug)}
                                                prefetch
                                                className="text-sm underline underline-offset-4"
                                            >
                                                Bekijken
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
}
