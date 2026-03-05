import { TimestampMixin, SoftDeleteMixin } from './common.types';

export interface Entity extends TimestampMixin, SoftDeleteMixin {
  id: number;
  name: string;
  code: string;
  description: string | null;
  qr_code: string;
  qr_code_image: string;
  entity_type: string | null;
  location: string | null;
  department: number;
  department_name: string;
  organization: number;
  organization_name: string;
  primary_image_url: string | null;
  primary_image?: EntityImage | null;
  metadata: Record<string, any> | null;
  status: string;
  has_open_issues?: boolean;
  open_issue_count?: number;
  // Optional equipment details
  serial_number?: string | null;
  manufacturer?: string | null;
  model?: string | null;
}

export interface EntityImage extends TimestampMixin {
  id: number;
  entity: number;
  image: string;
  thumbnail: string | null;
  caption: string | null;
  uploaded_by: number;
  uploaded_by_name: string;
}

export interface EntityDocument extends TimestampMixin {
  id: number;
  entity: number;
  document: string;
  title: string;
  description: string | null;
  uploaded_by: number;
  uploaded_by_name: string;
}

export interface EntityShare extends TimestampMixin {
  id: number;
  entity: number;
  entity_name: string;
  shared_with_department: number;
  department_name: string;
  shared_by_user: number;
  shared_by_name: string;
  reason: string | null;
  is_active: boolean;
  expires_at: string | null;
}

export interface EntityFilters {
  department?: number;
  entity_type?: string;
  qr_code?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

// ============ Admin CRUD Types ============

/**
 * Data for creating a new entity
 */
export interface CreateEntityData {
  name: string;
  code?: string;
  description?: string;
  entity_type?: string;
  location?: string;
  department: number;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  metadata?: Record<string, any>;
}

/**
 * Data for updating an entity
 */
export interface UpdateEntityData extends Partial<CreateEntityData> {
  status?: string;
}
