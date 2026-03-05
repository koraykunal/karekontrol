export interface Entity {
    id: number
    organization: number
    organization_name: string
    department: number
    department_name: string
    entity_type: string
    name: string
    code: string
    qr_code: string
    qr_image: string | null
    description: string | null
    custom_fields: Record<string, unknown>
    status: string
    location: string | null
    serial_number: string | null
    manufacturer: string | null
    model: string | null
    purchase_date: string | null
    warranty_expiry_date: string | null
    notes: string | null
    images: EntityImage[]
    documents: EntityDocument[]
    primary_image: EntityImage | null
    procedure_count: number
    is_deleted: boolean
    created_at: string
    updated_at: string
}

export interface EntityListItem {
    id: number
    organization: number
    organization_name: string
    department: number
    department_name: string
    entity_type: string
    name: string
    code: string
    qr_code: string
    status: string
    location: string | null
    primary_image_url: string | null
    open_issue_count: number
    created_at: string
}

export interface EntityImage {
    id: number
    entity: number
    image: string
    thumbnail: string | null
    caption: string | null
    is_primary: boolean
    order: number
    created_at: string
}

export interface EntityDocument {
    id: number
    entity: number
    file: string
    title: string
    document_type: string
    description: string | null
    created_at: string
}

export interface EntityShare {
    id: number
    entity: number
    entity_name: string
    shared_with_department: number
    department_name: string
    shared_by_user: number | null
    shared_by_name: string | null
    reason: string | null
    is_active: boolean
    expires_at: string | null
    created_at: string
}

export interface CreateEntityPayload {
    organization: number
    department: number
    entity_type: string
    name: string
    code?: string
    description?: string
    custom_fields?: Record<string, unknown>
    status?: string
    location?: string
    serial_number?: string
    manufacturer?: string
    model?: string
    purchase_date?: string
    warranty_expiry_date?: string
    notes?: string
}

export interface UpdateEntityPayload extends Partial<CreateEntityPayload> { }
