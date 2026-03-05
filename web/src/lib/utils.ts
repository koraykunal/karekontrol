import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"
import type { AxiosError } from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiErrorMessage(error: unknown, fallback = 'Bir hata oluştu'): string {
  const axiosError = error as AxiosError<{
    message?: string
    detail?: string
    errors?: Record<string, string[]>
    error?: { message?: string; details?: Record<string, string[]> }
  }>
  const data = axiosError?.response?.data
  if (!data) return fallback

  // Backend exception handler format: { error: { message, details } }
  if (data.error?.message) return data.error.message

  // Direct response format
  if (data.message) return data.message
  if (data.detail) return data.detail

  // Field-level validation errors from backend details
  const fieldErrors = data.error?.details ?? data.errors
  if (fieldErrors) {
    const firstField = Object.keys(fieldErrors)[0]
    if (firstField) {
      const messages = fieldErrors[firstField]
      return Array.isArray(messages) ? messages[0] : String(messages)
    }
  }

  return fallback
}

export function handleApiError(error: unknown, fallback?: string) {
  toast.error(getApiErrorMessage(error, fallback))
}
