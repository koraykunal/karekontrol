import axios, { AxiosError } from 'axios';
import type { ErrorResponse } from '../types/common.types';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

/**
 * Transform backend errors into user-friendly Turkish messages
 */
export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;

    // Network error
    if (!axiosError.response) {
      return {
        message: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
        statusCode: 0,
      };
    }

    const { status, data } = axiosError.response;

    // Exception handler format: { error: { code, message, details } }
    if (data?.error?.message) {
      return {
        message: translateErrorMessage(data.error.message),
        statusCode: status,
        errors: data.error.details,
      };
    }

    // DRF non_field_errors format (fallback)
    if (data?.non_field_errors) {
      const msg = Array.isArray(data.non_field_errors)
        ? data.non_field_errors[0]
        : data.non_field_errors;
      return {
        message: translateErrorMessage(String(msg)),
        statusCode: status,
      };
    }

    // Direct view response format: { message, errors }
    if (data?.message) {
      return {
        message: translateErrorMessage(data.message),
        statusCode: status,
        errors: data.errors,
      };
    }

    // HTTP status code error messages
    switch (status) {
      case 400:
        return {
          message: 'Geçersiz istek. Lütfen girdiğiniz bilgileri kontrol edin.',
          statusCode: 400,
        };
      case 401:
        return {
          message: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
          statusCode: 401,
        };
      case 403:
        return {
          message: 'Bu işlem için yetkiniz bulunmuyor.',
          statusCode: 403,
        };
      case 404:
        return {
          message: 'Aradığınız kayıt bulunamadı.',
          statusCode: 404,
        };
      case 409:
        return {
          message: 'Bu kayıt zaten mevcut.',
          statusCode: 409,
        };
      case 422:
        return {
          message: 'Girdiğiniz bilgiler geçersiz.',
          statusCode: 422,
        };
      case 429:
        return {
          message: 'Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.',
          statusCode: 429,
        };
      case 500:
        return {
          message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
          statusCode: 500,
        };
      case 503:
        return {
          message: 'Sunucu şu anda bakımda. Lütfen daha sonra tekrar deneyin.',
          statusCode: 503,
        };
      default:
        return {
          message: 'Bir hata oluştu. Lütfen tekrar deneyin.',
          statusCode: status,
        };
    }
  }

  // Unknown error
  return {
    message: 'Beklenmeyen bir hata oluştu.',
  };
}

/**
 * Translate common backend error messages to Turkish
 */
function translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    'Invalid credentials': 'E-posta veya şifre hatalı.',
    'Invalid email or password': 'E-posta veya şifre hatalı.',
    'User account is disabled': 'Kullanıcı hesabı devre dışı.',
    'Email and password are required': 'E-posta ve şifre gereklidir.',
    'User not found': 'Kullanıcı bulunamadı.',
    'Email already exists': 'Bu e-posta adresi zaten kullanılıyor.',
    'Invalid email': 'Geçersiz e-posta adresi.',
    'Password too short': 'Şifre çok kısa.',
    'Passwords do not match': 'Şifreler eşleşmiyor.',
    'Token is invalid or expired': 'Oturum süreniz dolmuş.',
    'Permission denied': 'Bu işlem için yetkiniz bulunmuyor.',
    'Not found': 'Kayıt bulunamadı.',
    'Required field': 'Bu alan zorunludur.',
    'Invalid format': 'Geçersiz format.',
  };

  return translations[message] || message;
}
