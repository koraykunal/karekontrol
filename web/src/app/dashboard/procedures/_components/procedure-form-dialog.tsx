'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { useProcedure, useCreateProcedure, useUpdateProcedure } from '@/hooks/queries/use-procedures'
import { useOrganizationOptions } from '@/hooks/queries/use-organizations'
import { useEntities } from '@/hooks/queries/use-entities'
import { ProcedurePriority, IntervalUnit, PRIORITY_LABELS } from '@/lib/constants'
import type { ProcedureListItem, OrganizationListItem, EntityListItem } from '@/types'

interface ProcedureFormData {
    title: string
    description: string
    priority: string
    interval_value: string
    interval_unit: string
    requires_approval: boolean
    is_active: boolean
    organization: string
    entity: string
}

interface ProcedureFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingProcedure?: ProcedureListItem | null
}

const intervalUnitLabels = {
    DAYS: 'Gün',
    WEEKS: 'Hafta',
    MONTHS: 'Ay',
    YEARS: 'Yıl',
}

export function ProcedureFormDialog({ open, onOpenChange, editingProcedure }: ProcedureFormDialogProps) {
    const isEditing = !!editingProcedure

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ProcedureFormData>({
        defaultValues: {
            priority: ProcedurePriority.MEDIUM,
            interval_unit: IntervalUnit.MONTHS,
            interval_value: '1',
            requires_approval: false,
            is_active: true,
        },
    })

    const selectedOrgId = watch('organization')

    const { data: procedureDetail } = useProcedure(editingProcedure?.id ?? 0, open && isEditing)
    const { data: orgsData } = useOrganizationOptions()
    const { data: entitiesData } = useEntities(
        { organization: parseInt(selectedOrgId, 10) || 0, page_size: 100 },
        !!selectedOrgId,
    )

    useEffect(() => {
        if (open && isEditing && procedureDetail) {
            reset({
                title: procedureDetail.title ?? '',
                description: procedureDetail.description ?? '',
                priority: procedureDetail.priority ?? ProcedurePriority.MEDIUM,
                interval_value: String(procedureDetail.interval_value ?? 1),
                interval_unit: procedureDetail.interval_unit ?? IntervalUnit.MONTHS,
                requires_approval: procedureDetail.requires_approval ?? false,
                is_active: procedureDetail.is_active ?? true,
                organization: String(procedureDetail.organization ?? ''),
                entity: String(procedureDetail.entity ?? ''),
            })
        } else if (open && !isEditing) {
            reset({
                title: '',
                description: '',
                priority: ProcedurePriority.MEDIUM,
                interval_value: '1',
                interval_unit: IntervalUnit.MONTHS,
                requires_approval: false,
                is_active: true,
                organization: '',
                entity: '',
            })
        }
    }, [open, isEditing, procedureDetail, reset])

    const createMutation = useCreateProcedure({ onSuccess: () => onOpenChange(false) })
    const updateMutation = useUpdateProcedure({ onSuccess: () => onOpenChange(false) })

    const isPending = createMutation.isPending || updateMutation.isPending

    const onSubmit = (data: ProcedureFormData) => {
        if (isEditing) {
            updateMutation.mutate({
                id: editingProcedure!.id,
                payload: {
                    title: data.title,
                    description: data.description || undefined,
                    priority: data.priority as typeof ProcedurePriority[keyof typeof ProcedurePriority],
                    interval_value: parseInt(data.interval_value, 10),
                    interval_unit: data.interval_unit as typeof IntervalUnit[keyof typeof IntervalUnit],
                    requires_approval: data.requires_approval,
                    is_active: data.is_active,
                },
            })
        } else {
            const orgId = parseInt(data.organization, 10)
            const entityId = parseInt(data.entity, 10)
            if (isNaN(orgId) || isNaN(entityId)) {
                toast.error('Organizasyon ve varlık seçimi zorunludur')
                return
            }
            createMutation.mutate({
                organization: orgId,
                entity: entityId,
                title: data.title,
                description: data.description || undefined,
                priority: data.priority as typeof ProcedurePriority[keyof typeof ProcedurePriority],
                interval_value: parseInt(data.interval_value, 10),
                interval_unit: data.interval_unit as typeof IntervalUnit[keyof typeof IntervalUnit],
                requires_approval: data.requires_approval,
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Prosedürü Düzenle' : 'Yeni Prosedür'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="proc-title">Başlık *</Label>
                        <Input id="proc-title" {...register('title', { required: 'Başlık gereklidir' })} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="proc-desc">Açıklama</Label>
                        <Textarea id="proc-desc" {...register('description')} rows={2} />
                    </div>

                    {!isEditing && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Organizasyon *</Label>
                                <Select
                                    value={watch('organization')}
                                    onValueChange={(v) => { setValue('organization', v); setValue('entity', '') }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {orgsData?.data?.map((org: OrganizationListItem) => (
                                            <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Varlık *</Label>
                                <Select
                                    value={watch('entity')}
                                    onValueChange={(v) => setValue('entity', v)}
                                    disabled={!selectedOrgId}
                                >
                                    <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {entitiesData?.data?.map((ent: EntityListItem) => (
                                            <SelectItem key={ent.id} value={String(ent.id)}>{ent.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Öncelik</Label>
                            <Select value={watch('priority')} onValueChange={(v) => setValue('priority', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.values(ProcedurePriority).map((p) => (
                                        <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Aralık</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    min="1"
                                    className="w-20"
                                    {...register('interval_value', { required: true, min: 1 })}
                                />
                                <Select value={watch('interval_unit')} onValueChange={(v) => setValue('interval_unit', v)}>
                                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.values(IntervalUnit).map((u) => (
                                            <SelectItem key={u} value={u}>{intervalUnitLabels[u]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('requires_approval')}
                                className="h-4 w-4 rounded"
                            />
                            <span className="text-sm">Onay gerektirir</span>
                        </label>
                        {isEditing && (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('is_active')}
                                    className="h-4 w-4 rounded"
                                />
                                <span className="text-sm">Aktif</span>
                            </label>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Oluştur'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
