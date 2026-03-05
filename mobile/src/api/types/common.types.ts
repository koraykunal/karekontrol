// Django REST Framework response format
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  total: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  page: number;
  total_pages: number;
  data: T[];
}

export interface ErrorResponse {
  success: false;
  error?: { code: string; message: string; details?: Record<string, string[]> };
  message?: string;
  errors?: Record<string, string[]>;
}

export interface TimestampMixin {
  created_at: string;
  updated_at: string;
}

export interface SoftDeleteMixin {
  is_deleted: boolean;
  deleted_at: string | null;
}
