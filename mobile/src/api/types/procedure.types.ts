import { TimestampMixin, SoftDeleteMixin } from './common.types';
import { ProcedurePriority, IntervalUnit } from './enums';

export interface Procedure extends TimestampMixin, SoftDeleteMixin {
  id: number;
  title: string;
  description: string | null;
  entity: number;
  entity_name: string;
  organization: number;
  organization_name: string;
  priority: ProcedurePriority;
  estimated_duration: number | null;
  requires_approval: boolean;
  created_by: number;
  created_by_name: string;
  tags: string[];
  metadata: Record<string, any> | null;
  interval_value?: number;
  interval_unit?: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS';
  last_completed_at?: string | null;
  next_due_date?: string | null;
  is_active?: boolean;
}

export interface ProcedureStep extends TimestampMixin {
  id: number;
  procedure: number;
  step_order: number;
  step_number: number;
  title: string;
  description: string | null;
  estimated_duration: number | null;
  checklist_items: ChecklistItem[];
  reference_images: string[];
  requires_photo: boolean;
  requires_signature: boolean;
  metadata: Record<string, any> | null;
}

export interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
}

export interface ProcedureTemplate extends TimestampMixin {
  id: number;
  name: string;
  description: string | null;
  is_public: boolean;
  created_by: number;
  created_by_name: string;
  organization: number | null;
  usage_count: number;
  base_procedure: number;
}

export interface ProcedureLog extends TimestampMixin {
  id: number;
  procedure: number;
  procedure_title: string;
  entity: number | null;
  entity_name: string | null;
  assigned_to: number;
  assigned_to_name: string;
  started_by: number | null;
  started_by_name: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration: number | null;
  completion_percentage: number;
  notes: string | null;
  status: string;
  organization_name?: string;
  step_logs?: StepLog[];
  next_procedure_date?: string | null;
}

export interface StepLog extends TimestampMixin {
  id: number;
  procedure_log: number;
  step: number;
  step_title: string;
  step_order?: number;
  is_completed: boolean;
  completion_status: string | null;
  completed_by: number | null;
  completed_by_name: string | null;
  completed_at: string | null;
  skipped: boolean;
  skip_reason: string | null;
  photo_urls: string[];
  checklist_results: Record<string, { checked: boolean; notes?: string }> | null;
  signature: string | null;
  notes: string | null;
  duration: number | null;
  issues?: {
    id: number;
    status: string;
    resolved_at: string | null;
    title: string;
    severity: string;
  }[];
  procedure_step?: ProcedureStep; // Details of the step definition
}

export interface ProcedureReminder extends TimestampMixin {
  id: number;
  procedure: number;
  entity: number | null;
  assigned_to: number;
  interval_value: number;
  interval_unit: IntervalUnit;
  last_executed: string | null;
  next_due: string;
  is_active: boolean;
}

export interface ProcedureFilters {
  department?: number;
  entity?: number;
  priority?: ProcedurePriority;
  requires_approval?: boolean;
  search?: string;
  tags?: string[];
  page?: number;
  page_size?: number;
}

export interface ProcedureLogFilters {
  procedure?: number;
  entity?: number;
  user?: number;
  status?: string;
  started_at_after?: string;
  started_at_before?: string;
  page?: number;
  page_size?: number;
}

/**
 * Data for completing a procedure
 */
export interface CompleteProcedureData {
  notes?: string;
}

/**
 * Data for completing a step
 */
export interface CompleteStepData {
  completion_status?: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE' | string;
  checklist_results?: Record<string, { checked: boolean; notes?: string }>;
  notes?: string;
  photo_urls?: string[];
  signature?: string;
  severity?: string;
}

// ============ Admin CRUD Types ============

/**
 * Data for creating a new procedure
 */
export interface CreateProcedureData {
  title: string;
  description?: string;
  entity: number;
  priority?: ProcedurePriority;
  estimated_duration?: number;
  requires_approval?: boolean;
  tags?: string[];
  interval_value?: number;
  interval_unit?: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS';
}

/**
 * Data for updating a procedure
 */
export interface UpdateProcedureData extends Partial<CreateProcedureData> {
  is_active?: boolean;
}

/**
 * Data for creating a new procedure step
 */
export interface CreateStepData {
  title: string;
  description?: string;
  step_order?: number;
  expected_duration_minutes?: number;
  requires_photo?: boolean;
  requires_notes?: boolean;
  requires_compliance_check?: boolean;
  reference_images?: string[];
  checklist_items?: ChecklistItem[];
}

/**
 * Data for updating a procedure step
 */
export interface UpdateStepData extends Partial<CreateStepData> { }

