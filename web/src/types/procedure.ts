import type { ProcedurePriority, IntervalUnit } from '@/lib/constants'

export interface Procedure {
    id: number
    organization: number
    organization_name?: string
    entity: number
    entity_name?: string
    title: string
    description: string | null
    priority: ProcedurePriority
    interval_value: number
    interval_unit: IntervalUnit
    estimated_duration_minutes: number | null
    is_active: boolean
    requires_approval: boolean
    created_by: number | null
    created_by_name?: string
    tags: string[]
    total_steps?: number
    created_at: string
    updated_at: string
}

export interface ProcedureListItem {
    id: number
    organization: number
    entity: number
    entity_name?: string
    title: string
    priority: ProcedurePriority
    interval_value: number
    interval_unit: IntervalUnit
    is_active: boolean
    total_steps?: number
    created_at: string
}

export interface ProcedureStep {
    id: number
    procedure: number
    step_order: number
    title: string
    description: string | null
    requires_photo: boolean
    requires_notes: boolean
    requires_compliance_check: boolean
    expected_duration_minutes: number | null
    reference_images: string[]
    checklist_items: string[]
    created_at: string
}

export interface ProcedureTemplate {
    id: number
    organization: number
    name: string
    description: string | null
    category: string | null
    template_data: Record<string, unknown>
    is_public: boolean
    created_by: number | null
    usage_count: number
    created_at: string
}

export interface CreateProcedurePayload {
    organization: number
    entity: number
    title: string
    description?: string
    priority?: ProcedurePriority
    interval_value: number
    interval_unit?: IntervalUnit
    estimated_duration_minutes?: number
    requires_approval?: boolean
    tags?: string[]
}

export interface CreateProcedureStepPayload {
    procedure: number
    step_order: number
    title: string
    description?: string
    requires_photo?: boolean
    requires_notes?: boolean
    requires_compliance_check?: boolean
    expected_duration_minutes?: number
    reference_images?: string[]
    checklist_items?: string[]
}
