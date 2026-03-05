'use client'

import { useState } from 'react'
import { Camera, FileText, ShieldCheck, Trash2, Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useProcedure, useProcedureSteps, useAddProcedureStep, useDeleteProcedureStep } from '@/hooks/queries/use-procedures'
import type { ProcedureStep } from '@/types'

interface ProcedureStepsDialogProps {
    procedureId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface StepFormData {
    title: string
    requires_photo: boolean
    requires_notes: boolean
    requires_compliance_check: boolean
    expected_duration_minutes: string
}

const emptyForm: StepFormData = {
    title: '',
    requires_photo: false,
    requires_notes: false,
    requires_compliance_check: false,
    expected_duration_minutes: '',
}

export function ProcedureStepsDialog({ procedureId, open, onOpenChange }: ProcedureStepsDialogProps) {
    const [form, setForm] = useState<StepFormData>(emptyForm)
    const [showAddForm, setShowAddForm] = useState(false)

    const id = procedureId ?? 0
    const { data: procedure } = useProcedure(id, open && id > 0)
    const { data: steps = [], isLoading } = useProcedureSteps(id, open && id > 0)

    const addMutation = useAddProcedureStep(id, {
        onSuccess: () => {
            setForm(emptyForm)
            setShowAddForm(false)
        },
    })

    const deleteMutation = useDeleteProcedureStep()

    const handleAdd = () => {
        if (!form.title.trim()) return
        const nextOrder = steps.length > 0 ? Math.max(...steps.map(s => s.step_order)) + 1 : 1
        addMutation.mutate({
            step_order: nextOrder,
            title: form.title.trim(),
            requires_photo: form.requires_photo,
            requires_notes: form.requires_notes,
            requires_compliance_check: form.requires_compliance_check,
            expected_duration_minutes: form.expected_duration_minutes ? parseInt(form.expected_duration_minutes, 10) : undefined,
        })
    }

    const handleDelete = (step: ProcedureStep) => {
        deleteMutation.mutate({ id: step.id, procedureId: id })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Prosedür Adımları
                        {procedure && <span className="ml-2 text-sm font-normal text-muted-foreground">— {procedure.title}</span>}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full" />
                        ))
                    ) : steps.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">Henüz adım eklenmemiş</p>
                    ) : (
                        steps.map((step) => (
                            <div key={step.id} className="flex items-start gap-3 rounded-md border p-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                    {step.step_order}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{step.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {step.requires_photo && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Camera className="h-3 w-3" />
                                                Fotoğraf
                                            </span>
                                        )}
                                        {step.requires_notes && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <FileText className="h-3 w-3" />
                                                Notlar
                                            </span>
                                        )}
                                        {step.requires_compliance_check && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <ShieldCheck className="h-3 w-3" />
                                                Uyum
                                            </span>
                                        )}
                                        {step.expected_duration_minutes && (
                                            <span className="text-xs text-muted-foreground">
                                                ~{step.expected_duration_minutes} dk
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(step)}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                {showAddForm ? (
                    <div className="space-y-3 rounded-md border p-4 mt-2">
                        <div className="space-y-2">
                            <Label>Adım Başlığı *</Label>
                            <Input
                                placeholder="Adım açıklaması..."
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.requires_photo}
                                    onChange={(e) => setForm((f) => ({ ...f, requires_photo: e.target.checked }))}
                                    className="h-3.5 w-3.5 rounded"
                                />
                                <Camera className="h-3.5 w-3.5" />
                                Fotoğraf
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.requires_notes}
                                    onChange={(e) => setForm((f) => ({ ...f, requires_notes: e.target.checked }))}
                                    className="h-3.5 w-3.5 rounded"
                                />
                                <FileText className="h-3.5 w-3.5" />
                                Notlar
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.requires_compliance_check}
                                    onChange={(e) => setForm((f) => ({ ...f, requires_compliance_check: e.target.checked }))}
                                    className="h-3.5 w-3.5 rounded"
                                />
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Uyum
                            </label>
                        </div>
                        <div className="space-y-2">
                            <Label>Tahmini Süre (dakika)</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="—"
                                className="w-32"
                                value={form.expected_duration_minutes}
                                onChange={(e) => setForm((f) => ({ ...f, expected_duration_minutes: e.target.value }))}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleAdd}
                                disabled={!form.title.trim() || addMutation.isPending}
                            >
                                {addMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setShowAddForm(false); setForm(emptyForm) }}
                            >
                                İptal
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setShowAddForm(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Adım Ekle
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    )
}
