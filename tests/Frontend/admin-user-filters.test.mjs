import assert from 'node:assert/strict';
import test from 'node:test';
import { filterAdminUsers } from '../../resources/js/lib/admin-user-filters.ts';

const users = [
    { id: 1, name: 'Admin Anna', email: 'anna@example.com', role: 'admin', created_at: '2026-01-01' },
    { id: 2, name: 'Bert User', email: 'bert@example.com', role: 'user', created_at: '2026-02-01' },
    { id: 3, name: 'Zara User', email: 'zara@shiftly.nl', role: 'user', created_at: '2026-03-01' },
];

const empty = { search: '', role: '' };

test('search matches name and email without case sensitivity', () => {
    assert.deepEqual(
        filterAdminUsers(users, { ...empty, search: '  ANNA  ' }).map((user) => user.id),
        [1],
    );
    assert.deepEqual(
        filterAdminUsers(users, { ...empty, search: 'shiftly' }).map((user) => user.id),
        [3],
    );
});

test('role filter can be combined with search', () => {
    assert.deepEqual(
        filterAdminUsers(users, { search: 'user', role: 'user' }).map((user) => user.id),
        [2, 3],
    );
    assert.deepEqual(
        filterAdminUsers(users, { search: 'user', role: 'admin' }).map((user) => user.id),
        [],
    );
});

test('empty filters return everyone', () => {
    assert.deepEqual(filterAdminUsers(users, empty), users);
});
