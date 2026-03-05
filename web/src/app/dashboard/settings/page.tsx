'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/shared/page-header'
import { useAuthStore } from '@/store/auth'
import { usersApi, authApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'

const profileSchema = z.object({
    full_name: z.string().min(1, 'Ad Soyad zorunludur'),
    phone: z.string().optional(),
})

const passwordSchema = z.object({
    old_password: z.string().min(1, 'Mevcut şifre zorunludur'),
    new_password: z.string()
        .min(8, 'Yeni şifre en az 8 karakter olmalıdır')
        .regex(/[A-Z]/, 'En az bir büyük harf içermelidir')
        .regex(/[a-z]/, 'En az bir küçük harf içermelidir')
        .regex(/[0-9]/, 'En az bir rakam içermelidir')
        .regex(/[^A-Za-z0-9]/, 'En az bir özel karakter içermelidir'),
    confirm_new_password: z.string().min(1, 'Şifre tekrarı zorunludur'),
}).refine((data) => data.new_password === data.confirm_new_password, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirm_new_password'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function SettingsPage() {
    const user = useAuthStore((s) => s.user)
    const setUser = useAuthStore((s) => s.setUser)

    const profileForm = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: user?.full_name ?? '',
            phone: user?.phone ?? '',
        },
    })

    const passwordForm = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { old_password: '', new_password: '', confirm_new_password: '' },
    })

    async function handleProfileSubmit(values: ProfileForm) {
        if (!user) return
        try {
            const res = await usersApi.update(user.id, {
                full_name: values.full_name,
                phone: values.phone || undefined,
            })
            setUser(res.data)
            toast.success('Profil güncellendi')
        } catch (error) {
            handleApiError(error, 'Güncelleme başarısız')
        }
    }

    async function handlePasswordSubmit(values: PasswordForm) {
        try {
            await authApi.changePassword({
                old_password: values.old_password,
                new_password: values.new_password,
                new_password_confirm: values.confirm_new_password,
            })
            toast.success('Şifre değiştirildi')
            passwordForm.reset()
        } catch (error) {
            handleApiError(error, 'Şifre değiştirilemedi')
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Ayarlar"
                description="Hesap ve profil ayarları"
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Profil Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                                <div className="text-sm text-muted-foreground mb-2">
                                    {user?.email}
                                </div>
                                <FormField
                                    control={profileForm.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ad Soyad</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefon</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="+90 555 000 00 00" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    disabled={profileForm.formState.isSubmitting}
                                    className="w-full"
                                >
                                    {profileForm.formState.isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Şifre Değiştir</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="old_password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mevcut Şifre</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="new_password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Yeni Şifre</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirm_new_password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Yeni Şifre Tekrar</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    disabled={passwordForm.formState.isSubmitting}
                                    className="w-full"
                                >
                                    {passwordForm.formState.isSubmitting ? 'Değiştiriliyor...' : 'Değiştir'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
