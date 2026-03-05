export interface ImportResult {
    created_count: number
    steps_count?: number
}

export interface ImportError {
    row: number
    field: string
    message: string
}

export interface ImportErrorResult {
    errors: ImportError[]
}
