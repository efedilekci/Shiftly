export type HourEntry = {
    id: number;
    baan_id: number | null;
    baan_name: string;
    work_date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    duration_minutes: number;
    earnings_cents: number;
    note: string | null;
    approval_status?: string;
    approval_status_label?: string;
    is_company_entry?: boolean;
    can_edit?: boolean;
};
