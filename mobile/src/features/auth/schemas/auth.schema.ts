import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Mevcut şifrenizi giriniz'),
  new_password: z.string().min(8, 'Yeni şifre en az 8 karakter olmalıdır'),
  new_password_confirm: z.string(),
}).refine(data => data.new_password === data.new_password_confirm, {
  message: 'Şifreler eşleşmiyor',
  path: ['new_password_confirm'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
