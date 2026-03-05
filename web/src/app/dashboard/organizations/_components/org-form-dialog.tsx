'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    useOrganization,
    useUpdateOrganization,
} from '@/hooks/queries/use-organizations'
import type { OrganizationListItem } from '@/types'

const orgSchema = z.object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
    company_number: z.string().min(1, 'Firma numarası zorunludur'),
    registration_number: z.string().optional(),
    qr_quota: z.number().int().min(0, 'Kota 0 veya üzeri olmalı'),
    description: z.string().optional(),
    contact_email: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
    contact_phone: z.string().optional(),
    address: z.string().optional(),
})

type OrgFormData = z.infer<typeof orgSchema>

interface OrgFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingOrg?: OrganizationListItem | null
}

export function OrgFormDialog({ open, onOpenChange, editingOrg }: OrgFormDialogProps) {
    if (!editingOrg) return null

    return <OrgEditForm open={open} onOpenChange={onOpenChange} editingOrg={editingOrg} />
}

function OrgEditForm({ open, onOpenChange, editingOrg }: { open: boolean; onOpenChange: (open: boolean) => void; editingOrg: OrganizationListItem }) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<OrgFormData>({
        resolver: zodResolver(orgSchema),
    })

    const { data: org } = useOrganization(editingOrg.id, open)

    useEffect(() => {
        if (open && org) {
            reset({
                name: org.name,
                company_number: org.company_number ?? '',
                registration_number: org.registration_number ?? '',
                qr_quota: org.qr_quota ?? 0,
                description: org.description ?? '',
                contact_email: org.contact_email ?? '',
                contact_phone: org.contact_phone ?? '',
                address: org.address ?? '',
            })
        }
    }, [open, org, reset])

    const updateMutation = useUpdateOrganization({ onSuccess: () => onOpenChange(false) })

    const onSubmit = (data: OrgFormData) => {
        updateMutation.mutate({
            id: editingOrg.id,
            payload: {
                name: data.name,
                company_number: data.company_number,
                registration_number: data.registration_number || undefined,
                qr_quota: data.qr_quota,
                description: data.description || undefined,
                contact_email: data.contact_email || undefined,
                contact_phone: data.contact_phone || undefined,
                address: data.address || undefined,
            },
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Organizasyonu Düzenle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">İsim *</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="company_number">Firma Numarası *</Label>
                            <Input id="company_number" {...register('company_number')} />
                            {errors.company_number && <p className="text-sm text-destructive">{errors.company_number.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registration_number">Sicil Numarası</Label>
                            <Input id="registration_number" {...register('registration_number')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="qr_quota">QR Kotası</Label>
                        <Input
                            id="qr_quota"
                            type="number"
                            min={0}
                            {...register('qr_quota', { valueAsNumber: true })}
                        />
                        {errors.qr_quota && <p className="text-sm text-destructive">{errors.qr_quota.message}</p>}
                        <p className="text-xs text-muted-foreground">0 = Sınırsız</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama</Label>
                        <Input id="description" {...register('description')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact_email">İletişim E-postası</Label>
                        <Input id="contact_email" type="email" {...register('contact_email')} />
                        {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact_phone">Telefon</Label>
                        <Input id="contact_phone" {...register('contact_phone')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Adres</Label>
                        <Input id="address" {...register('address')} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Kaydediliyor...' : 'Güncelle'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
