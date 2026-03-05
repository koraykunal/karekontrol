'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useProcedureSteps, useAddProcedureStep, useDeleteProcedureStep, useReorderSteps } from '@/hooks/queries/use-procedures'
import type { ProcedureStep } from '@/types'

const stepSchema = z.object({
    title: z.string().min(1, 'Başlık zorunludur'),
    description: z.string().optional(),
    requires_compliance_check: z.boolean(),
    requires_notes: z.boolean(),
})

type StepForm = z.infer<typeof stepSchema>

interface StepsSectionProps {
    procedureId: number
}

export function StepsSection({ procedureId }: StepsSectionProps) {
    const { data: steps = [], isLoading } = useProcedureSteps(procedureId)
    const addMutation = useAddProcedureStep(procedureId)
    const deleteMutation = useDeleteProcedureStep()
    const reorderMutation = useReorderSteps(procedureId)
    const [addOpen, setAddOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ProcedureStep | null>(null)

    const form = useForm<StepForm>({
        resolver: zodResolver(stepSchema),
        defaultValues: { title: '', description: '', requires_compliance_check: false, requires_notes: false },
    })

    function handleAdd(values: StepForm) {
        addMutation.mutate(
            {
                title: values.title,
                description: values.description || undefined,
                requires_compliance_check: values.requires_compliance_check,
                requires_notes: values.requires_notes,
                step_order: steps.length + 1,
            },
            {
                onSuccess: () => {
                    setAddOpen(false)
                    form.reset()
                },
            }
        )
    }

    function moveStep(index: number, direction: 'up' | 'down') {
        const sorted = [...steps].sort((a, b) => a.step_order - b.step_order)
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= sorted.length) return
        const swapped = [...sorted]
        const temp = swapped[index]
        swapped[index] = swapped[targetIndex]
        swapped[targetIndex] = temp
        const step_orders = swapped.map((s, i) => ({ id: s.id, order: i + 1 }))
        reorderMutation.mutate(step_orders)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle className="text-base">Adımlar</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
                </CardContent>
            </Card>
        )
    }

    const sorted = [...steps].sort((a, b) => a.step_order - b.step_order)

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Adımlar ({steps.length})</CardTitle>
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Adım Ekle
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {sorted.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">Henüz adım eklenmemiş</p>
                    ) : (
                        <div className="divide-y">
                            {sorted.map((step, index) => (
                                <div key={step.id} className="flex items-center gap-3 px-6 py-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{step.title}</span>
                                            {step.requires_compliance_check && (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                                    Kritik
                                                </Badge>
                                            )}
                                        </div>
                                        {step.description && (
                                            <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => moveStep(index, 'up')}
                                            disabled={index === 0 || reorderMutation.isPending}
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => moveStep(index, 'down')}
                                            disabled={index === sorted.length - 1 || reorderMutation.isPending}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => setDeleteTarget(step)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adım Ekle</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Başlık</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Adım başlığı" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Açıklama</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} placeholder="Adım açıklaması (opsiyonel)" rows={3} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="requires_compliance_check"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <FormLabel className="text-sm font-medium">Kritik Adım</FormLabel>
                                            <p className="text-xs text-muted-foreground">Uyumluluk kontrolü gerektirir</p>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="requires_notes"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <FormLabel className="text-sm font-medium">Not Zorunlu</FormLabel>
                                            <p className="text-xs text-muted-foreground">Tamamlama notu girilmesi gerekir</p>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>İptal</Button>
                                <Button type="submit" disabled={addMutation.isPending}>
                                    {addMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
                title="Adımı Sil"
                description={`"${deleteTarget?.title}" adımı kalıcı olarak silinecek.`}
                onConfirm={() => {
                    if (deleteTarget) {
                        deleteMutation.mutate(
                            { id: deleteTarget.id, procedureId },
                            { onSuccess: () => setDeleteTarget(null) }
                        )
                    }
                }}
                isLoading={deleteMutation.isPending}
            />
        </>
    )
}
