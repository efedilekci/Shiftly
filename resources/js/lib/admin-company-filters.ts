export type AdminCompanyRow = {
    id: number;
    name: string;
    slug: string;
    members_count: number;
    hour_approval_mode: string;
    hour_approval_mode_label: string;
    owner_id: number;
    owner_name: string;
    owner_email: string | null;
    created_at: string | null;
};

export type AdminCompanyFilters = {
    search: string;
};

export function filterAdminCompanies(companies: AdminCompanyRow[], filters: AdminCompanyFilters): AdminCompanyRow[] {
    const search = filters.search.trim().toLocaleLowerCase('nl-NL');

    if (!search) {
        return companies;
    }

    return companies.filter(
        (company) =>
            company.name.toLocaleLowerCase('nl-NL').includes(search) ||
            company.owner_name.toLocaleLowerCase('nl-NL').includes(search) ||
            (company.owner_email?.toLocaleLowerCase('nl-NL').includes(search) ?? false) ||
            company.slug.toLocaleLowerCase('nl-NL').includes(search),
    );
}
