import assert from 'node:assert/strict';
import test from 'node:test';
import { filterAdminCompanies } from '../../resources/js/lib/admin-company-filters.ts';

const companies = [
    {
        id: 1,
        name: 'Alpha BV',
        slug: 'alpha-bv',
        members_count: 2,
        hour_approval_mode: 'auto',
        hour_approval_mode_label: 'Direct goedgekeurd',
        owner_id: 1,
        owner_name: 'Sara Bakker',
        owner_email: 'sara@shiftly.test',
        created_at: '2026-10-01',
    },
    {
        id: 2,
        name: 'Zeta BV',
        slug: 'zeta-bv',
        members_count: 1,
        hour_approval_mode: 'owner',
        hour_approval_mode_label: 'Goedkeuring alleen door eigenaar',
        owner_id: 2,
        owner_name: 'Tom Jansen',
        owner_email: 'tom@shiftly.test',
        created_at: '2026-10-02',
    },
];

test('empty search returns all companies', () => {
    assert.deepEqual(
        filterAdminCompanies(companies, { search: '   ' }).map((row) => row.id),
        [1, 2],
    );
});

test('search matches company name, owner and slug without case sensitivity', () => {
    assert.deepEqual(
        filterAdminCompanies(companies, { search: '  ALPHA  ' }).map((row) => row.id),
        [1],
    );
    assert.deepEqual(
        filterAdminCompanies(companies, { search: 'tom' }).map((row) => row.id),
        [2],
    );
    assert.deepEqual(
        filterAdminCompanies(companies, { search: 'sara@' }).map((row) => row.id),
        [1],
    );
    assert.deepEqual(
        filterAdminCompanies(companies, { search: 'zeta-bv' }).map((row) => row.id),
        [2],
    );
});
