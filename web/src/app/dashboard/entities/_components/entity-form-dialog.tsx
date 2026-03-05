'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AlertTriangle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useEntity, useCreateEntity, useUpdateEntity } from '@/hooks/queries/use-entities'
import { useOrganizationOptions, useOrganizationQuota } from '@/hooks/queries/use-organizations'
import { useDepartmentOptions } from '@/hooks/queries/use-departments'
import { ENTITY_TYPES, ENTITY_STATUSES } from '@/lib/constants'
import type { EntityListItem, OrganizationListItem, DepartmentListItem } from '@/types'

interface EntityFormData {
    name: string
    code: string
    entity_type: string
    description: string
    location: string
    serial_number: string
    manufacturer: string
    model: string
    status: string
    organization: string
    department: string
}

interface EntityFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingEntity?: EntityListItem | null
}

export function EntityFormDialog({ open, onOpenChange, editingEntity }: EntityFormDialogProps) {
    const isEditing = !!editingEntity

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<EntityFormData>()

    const selectedOrgId = watch('organization')
    const parsedOrgId = selectedOrgId ? parseInt(selectedOrgId, 10) : 0

    const { data: entityDetail } = useEntity(editingEntity?.id ?? 0, open && isEditing)
    const { data: orgsData } = useOrganizationOptions()
    const { data: deptsData } = useDepartmentOptions(parsedOrgId || undefined)
    const { data: quotaData } = useOrganizationQuota(parsedOrgId, !isEditing && parsedOrgId > 0)

    const quotaFull = quotaData && !quotaData.is_unlimited && quotaData.remaining !== null && quotaData.remaining <= 0
    const quotaLow = quotaData && !quotaData.is_unlimited && quotaData.remaining !== null && quotaData.remaining > 0 && quotaData.remaining <= 5

    useEffect(() => {
        if (open && entityDetail) {
            reset({
                name: entityDetail.name ?? '',
                code: entityDetail.code ?? '',
                entity_type: entityDetail.entity_type ?? '',
                description: entityDetail.description ?? '',
                location: entityDetail.location ?? '',
                serial_number: entityDetail.serial_number ?? '',
                manufacturer: entityDetail.manufacturer ?? '',
                model: entityDetail.model ?? '',
                status: entityDetail.status ?? 'ACTIVE',
                organization: String(entityDetail.organization ?? ''),
                department: String(entityDetail.department ?? ''),
            })
        } else if (open && !isEditing) {
            reset({ name: '', code: '', entity_type: 'EQUIPMENT', description: '', location: '', serial_number: '', manufacturer: '', model: '', status: 'ACTIVE', organization: '', department: '' })
        }
    }, [open, entityDetail, isEditing, reset])

    const createMutation = useCreateEntity({ onSuccess: () => onOpenChange(false) })
    const updateMutation = useUpdateEntity({ onSuccess: () => onOpenChange(false) })

    const isPending = createMutation.isPending || updateMutation.isPending

    const onSubmit = (data: EntityFormData) => {
        if (isEditing) {
            updateMutation.mutate({
                id: editingEntity!.id,
                payload: {
                    name: data.name,
                    entity_type: data.entity_type,
                    description: data.description || undefined,
                    location: data.location || undefined,
                    serial_number: data.serial_number || undefined,
                    manufacturer: data.manufacturer || undefined,
                    model: data.model || undefined,
                    status: data.status,
                },
            })
        } else {
            const orgId = parseInt(data.organization, 10)
            const deptId = parseInt(data.department, 10)
            if (isNaN(orgId) || isNaN(deptId)) {
                toast.error('Organizasyon ve departman seçimi zorunludur')
                return
            }
            createMutation.mutate({
                organization: orgId,
                department: deptId,
                entity_type: data.entity_type,
                name: data.name,
                code: data.code || undefined,
                description: data.description || undefined,
                location: data.location || undefined,
                serial_number: data.serial_number || undefined,
                manufacturer: data.manufacturer || undefined,
                model: data.model || undefined,
                status: data.status || 'ACTIVE',
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Varlığı Düzenle' : 'Yeni Varlık'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="ent-name">İsim *</Label>
                            <Input id="ent-name" {...register('name', { required: 'İsim gereklidir' })} />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ent-code">Kod</Label>
                            <Input id="ent-code" {...register('code')} disabled={isEditing} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Tip</Label>
                            <Select value={watch('entity_type')} onValueChange={(v) => setValue('entity_type', v)}>
                                <SelectTrigger><SelectValue placeholder="Tip seçin" /></SelectTrigger>
                                <SelectContent>
                                    {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Durum</Label>
                            <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
                                <SelectTrigger><SelectValue placeholder="Durum seçin" /></SelectTrigger>
                                <SelectContent>
                                    {ENTITY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {!isEditing && (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Organizasyon *</Label>
                                    <Select value={watch('organization')} onValueChange={(v) => { setValue('organization', v); setValue('department', '') }}>
                                        <SelectTrigger><SelectValue placeholder="Organizasyon seçin" /></SelectTrigger>
                                        <SelectContent>
                                            {orgsData?.data?.map((org: OrganizationListItem) => (
                                                <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selectedOrgId && (
                                    <div className="space-y-2">
                                        <Label>Departman *</Label>
                                        <Select value={watch('department')} onValueChange={(v) => setValue('department', v)}>
                                            <SelectTrigger><SelectValue placeholder="Departman seçin" /></SelectTrigger>
                                            <SelectContent>
                                                {deptsData?.data?.map((dept: DepartmentListItem) => (
                                                    <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {quotaFull && (
                                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                                    <p className="text-sm text-destructive">
                                        Bu organizasyonun QR kotası dolmuş ({quotaData.entity_count}/{quotaData.qr_quota}). Yeni varlık oluşturulamaz.
                                    </p>
                                </div>
                            )}

                            {quotaLow && (
                                <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 p-3">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        QR kotası dolmak üzere. Kalan: {quotaData.remaining}/{quotaData.qr_quota}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="ent-location">Konum</Label>
                        <Input id="ent-location" {...register('location')} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="ent-manufacturer">Üretici</Label>
                            <Input id="ent-manufacturer" {...register('manufacturer')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ent-model">Model</Label>
                            <Input id="ent-model" {...register('model')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ent-serial">Seri No</Label>
                            <Input id="ent-serial" {...register('serial_number')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ent-desc">Açıklama</Label>
                        <Textarea id="ent-desc" {...register('description')} rows={3} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                        <Button type="submit" disabled={isPending || !!quotaFull}>
                            {isPending ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Oluştur'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
