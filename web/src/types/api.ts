export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
}

export interface PaginatedResponse<T> {
    success: boolean
    data: T[]
    total: number
    page: number
    page_size: number
    total_pages: number
    next: string | null
    previous: string | null
}

export interface ApiError {
    success: false
    message: string
    errors?: Record<string, string[]>
    code?: string
}

export interface PaginationParams {
    page?: number
    page_size?: number
    search?: string
    ordering?: string
}
