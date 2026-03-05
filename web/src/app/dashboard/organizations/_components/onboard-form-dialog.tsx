'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useOnboardOrganization } from '@/hooks/queries/use-organizations'
import type { OnboardOrganizationResponse } from '@/types'

const onboardSchema = z.object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
    company_number: z.string().min(1, 'Firma numarası zorunludur'),
    registration_number: z.string().optional(),
    address: z.string().optional(),
    contact_email: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
    contact_phone: z.string().optional(),
    description: z.string().optional(),
    qr_quota: z.number().int().min(0, 'Kota 0 veya üzeri olmalı'),
    admin_full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalı'),
    admin_email: z.string().email('Geçerli e-posta giriniz'),
    admin_phone: z.string().optional(),
    admin_password: z.string().optional(),
})

type OnboardFormData = z.infer<typeof onboardSchema>

interface OnboardFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function OnboardFormDialog({ open, onOpenChange }: OnboardFormDialogProps) {
    const [autoPassword, setAutoPassword] = useState(true)
    const [result, setResult] = useState<OnboardOrganizationResponse | null>(null)
    const [copied, setCopied] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<OnboardFormData>({
        resolver: zodResolver(onboardSchema),
        defaultValues: { qr_quota: 0 },
    })

    const onboardMutation = useOnboardOrganization({
        onSuccess: () => {},
    })

    const onSubmit = (data: OnboardFormData) => {
        const payload = {
            ...data,
            registration_number: data.registration_number || undefined,
            address: data.address || undefined,
            contact_email: data.contact_email || undefined,
            contact_phone: data.contact_phone || undefined,
            description: data.description || undefined,
            admin_phone: data.admin_phone || undefined,
            admin_password: autoPassword ? undefined : (data.admin_password || undefined),
        }

        onboardMutation.mutate(payload, {
            onSuccess: (response) => {
                setResult(response.data)
            },
        })
    }

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            setResult(null)
            setCopied(false)
            setShowPassword(false)
            setAutoPassword(true)
            reset({ qr_quota: 0 })
        }
        onOpenChange(isOpen)
    }

    const copyPassword = async () => {
        if (result?.admin_password) {
            await navigator.clipboard.writeText(result.admin_password)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (result) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Onboarding Tamamlandı</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                            <p className="text-sm font-medium">Organizasyon</p>
                            <p className="text-sm text-muted-foreground">{result.organization.name}</p>
                            <p className="text-xs text-muted-foreground">Firma No: {result.organization.company_number}</p>
                        </div>

                        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                            <p className="text-sm font-medium">Admin Kullanıcı</p>
                            <p className="text-sm text-muted-foreground">{result.admin_user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{result.admin_user.email}</p>
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 space-y-2">
                            <p className="text-sm font-medium">Giriş Şifresi</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 rounded bg-background px-2 py-1 text-sm font-mono">
                                    {showPassword ? result.admin_password : '••••••••••••'}
                                </code>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1"
                                    onClick={copyPassword}
                                >
                                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                    {copied ? 'Kopyalandı' : 'Kopyala'}
                                </Button>
                            </div>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                Bu şifreyi güvenli bir şekilde saklayın. Dialog kapatıldıktan sonra tekrar görüntülenemez.
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={() => handleClose(false)}>Kapat</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Yeni Müşteri Onboarding</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Firma Bilgileri */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Firma Bilgileri</h3>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ob-name">Firma Adı *</Label>
                                <Input id="ob-name" {...register('name')} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ob-company-number">Firma Numarası *</Label>
                                <Input id="ob-company-number" {...register('company_number')} />
                                {errors.company_number && <p className="text-sm text-destructive">{errors.company_number.message}</p>}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ob-reg-number">Sicil Numarası</Label>
                                <Input id="ob-reg-number" {...register('registration_number')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ob-quota">QR Kotası *</Label>
                                <Input
                                    id="ob-quota"
                                    type="number"
                                    min={0}
                                    {...register('qr_quota', { valueAsNumber: true })}
                                />
                                {errors.qr_quota && <p className="text-sm text-destructive">{errors.qr_quota.message}</p>}
                                <p className="text-xs text-muted-foreground">0 = Sınırsız</p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ob-email">E-posta</Label>
                                <Input id="ob-email" type="email" {...register('contact_email')} />
                                {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ob-phone">Telefon</Label>
                                <Input id="ob-phone" {...register('contact_phone')} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ob-address">Adres</Label>
                            <Input id="ob-address" {...register('address')} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ob-description">Açıklama</Label>
                            <Input id="ob-description" {...register('description')} />
                        </div>
                    </div>

                    {/* Admin Bilgileri */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Yetkili Kişi (Admin)</h3>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ob-admin-name">Ad Soyad *</Label>
                                <Input id="ob-admin-name" {...register('admin_full_name')} />
                                {errors.admin_full_name && <p className="text-sm text-destructive">{errors.admin_full_name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ob-admin-email">E-posta *</Label>
                                <Input id="ob-admin-email" type="email" {...register('admin_email')} />
                                {errors.admin_email && <p className="text-sm text-destructive">{errors.admin_email.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ob-admin-phone">Telefon</Label>
                            <Input id="ob-admin-phone" {...register('admin_phone')} />
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                id="ob-auto-pw"
                                checked={autoPassword}
                                onCheckedChange={setAutoPassword}
                            />
                            <Label htmlFor="ob-auto-pw" className="cursor-pointer">Şifreyi otomatik oluştur</Label>
                        </div>

                        {!autoPassword && (
                            <div className="space-y-2">
                                <Label htmlFor="ob-admin-password">Şifre</Label>
                                <Input id="ob-admin-password" type="password" {...register('admin_password')} />
                                {errors.admin_password && <p className="text-sm text-destructive">{errors.admin_password.message}</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={onboardMutation.isPending}>
                            {onboardMutation.isPending ? 'Oluşturuluyor...' : 'Onboard Et'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
