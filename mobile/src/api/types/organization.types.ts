import { TimestampMixin, SoftDeleteMixin } from './common.types';

export interface Organization extends TimestampMixin {
    id: number;
    name: string;
    company_number: string | null;
    registration_number: string | null;
    qr_quota: number;
    description: string | null;
    is_active: boolean;
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
    department_count: number;
    user_count: number;
    entity_count: number;
}

export interface Department extends TimestampMixin, SoftDeleteMixin {
    id: number;
    params?: any; // Added for flexibility
    organization: number;
    name: string;
    description: string | null;
    manager: number | null; // User ID
    manager_name: string | null;
    parent: number | null; // Parent Department ID
    parent_name: string | null;
}

