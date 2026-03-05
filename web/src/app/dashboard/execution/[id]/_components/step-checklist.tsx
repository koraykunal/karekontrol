'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, XCircle, SkipForward, AlertTriangle, Camera, FileText, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useCompleteStep, useSkipStep } from '@/hooks/queries/use-execution'
import { COMPLETION_STATUS_LABELS } from '@/lib/constants'
import type { StepLog } from '@/types'

interface StepChecklistProps {
    logId: number
    stepLogs: StepLog[]
    disabled?: boolean
}

interface StepRowProps {
    stepLog: StepLog
    logId: number
    disabled: boolean
}

function StepPhotos({ urls }: { urls: string[] }) {
    const [selectedImg, setSelectedImg] = useState<string | null>(null)

    if (urls.length === 0) return null

    return (
        <>
            <div className="flex flex-wrap gap-2 mt-2">
                {urls.map((url, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedImg(url)}
                        className="relative h-16 w-16 overflow-hidden rounded-md border hover:ring-2 hover:ring-primary/50 transition-all"
                    >
                        <Image
                            src={url}
                            alt={`Adım fotoğrafı ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    </button>
                ))}
            </div>
            {selectedImg && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                    onClick={() => setSelectedImg(null)}
                >
                    <div className="relative max-h-[85vh] max-w-[85vw]" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={selectedImg}
                            alt="Fotoğraf"
                            width={900}
                            height={700}
                            className="rounded-lg object-contain max-h-[85vh]"
                        />
                        <Button
                            size="sm"
                            variant="secondary"
                            className="absolute top-2 right-2"
                            onClick={() => setSelectedImg(null)}
                        >
                            Kapat
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
}

function ChecklistResults({ results }: { results: Record<string, { checked: boolean }> }) {
    const items = Object.entries(results)
    if (items.length === 0) return null

    return (
        <div className="mt-2 space-y-1">
            {items.map(([label, val]) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                    {val.checked ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <span className={val.checked ? 'text-foreground' : 'text-muted-foreground line-through'}>{label}</span>
                </div>
            ))}
        </div>
    )
}

function StepRow({ stepLog, logId, disabled }: StepRowProps) {
    const [notes, setNotes] = useState('')
    const [showNotes, setShowNotes] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const completeMutation = useCompleteStep(logId)
    const skipMutation = useSkipStep(logId)

    const step = stepLog.procedure_step
    const isCompleted = stepLog.is_completed
    const completionStatus = stepLog.completion_status
    const requiresComplianceCheck = step?.requires_compliance_check ?? false
    const requiresNotes = step?.requires_notes ?? false

    const hasPhotos = (stepLog.photo_urls && stepLog.photo_urls.length > 0) || !!stepLog.photo_url
    const photoList = stepLog.photo_urls?.length
        ? stepLog.photo_urls
        : stepLog.photo_url
            ? [stepLog.photo_url]
            : []
    const hasChecklist = stepLog.checklist_results && Object.keys(stepLog.checklist_results).length > 0
    const hasDetails = isCompleted && (stepLog.notes || hasPhotos || hasChecklist || stepLog.issues?.length > 0)

    function handleComplete(completion_status: 'COMPLIANT' | 'NON_COMPLIANT') {
        completeMutation.mutate(
            { stepId: stepLog.id, completion_status, notes: notes || undefined },
            { onSuccess: () => { setNotes(''); setShowNotes(false) } }
        )
    }

    function handleSkip() {
        skipMutation.mutate({ stepId: stepLog.id })
    }

    const isPending = completeMutation.isPending || skipMutation.isPending

    return (
        <div className="px-4 py-4 space-y-3">
            <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isCompleted
                        ? completionStatus === 'COMPLIANT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : completionStatus === 'NON_COMPLIANT'
                                ? 'bg-red-100 text-red-700'
                                : completionStatus === 'SKIPPED'
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-muted text-muted-foreground'
                        : 'bg-muted text-muted-foreground'
                }`}>
                    {stepLog.step_order ?? step?.step_order ?? '-'}
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                            {stepLog.step_title ?? step?.title ?? `Adım #${stepLog.step_id}`}
                        </span>
                        {requiresComplianceCheck && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Kritik
                            </Badge>
                        )}
                        {isCompleted && completionStatus && (
                            <Badge
                                variant="outline"
                                className={completionStatus === 'COMPLIANT'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                                    : completionStatus === 'NON_COMPLIANT'
                                        ? 'bg-red-50 text-red-700 border-red-200 text-xs'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 text-xs'
                                }
                            >
                                {COMPLETION_STATUS_LABELS[completionStatus] ?? completionStatus}
                            </Badge>
                        )}
                        {hasPhotos && (
                            <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                    </div>
                    {step?.description && !isCompleted && (
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    )}
                    {isCompleted && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                            {stepLog.completed_by_name && (
                                <span>{stepLog.completed_by_name}</span>
                            )}
                            {stepLog.completed_at && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(stepLog.completed_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            {stepLog.duration_minutes != null && stepLog.duration_minutes > 0 && (
                                <span>{stepLog.duration_minutes} dk</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {!isCompleted && !disabled && (
                        <>
                            {!requiresComplianceCheck && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs text-muted-foreground"
                                    onClick={handleSkip}
                                    disabled={isPending}
                                >
                                    <SkipForward className="mr-1 h-3.5 w-3.5" />
                                    Atla
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleComplete('COMPLIANT')}
                                disabled={isPending}
                            >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                Uyumlu
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50"
                                onClick={() => {
                                    if (requiresNotes || !showNotes) {
                                        setShowNotes(true)
                                    } else {
                                        handleComplete('NON_COMPLIANT')
                                    }
                                }}
                                disabled={isPending}
                            >
                                <XCircle className="mr-1 h-3.5 w-3.5" />
                                Uyumsuz
                            </Button>
                        </>
                    )}
                    {hasDetails && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setExpanded((v) => !v)}
                        >
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </div>

            {expanded && isCompleted && (
                <div className="ml-9 space-y-2 rounded-md bg-muted/40 p-3">
                    {step?.description && (
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                    )}
                    {stepLog.notes && (
                        <div className="flex gap-2 text-xs">
                            <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                            <p className="text-foreground">{stepLog.notes}</p>
                        </div>
                    )}
                    {photoList.length > 0 && <StepPhotos urls={photoList} />}
                    {hasChecklist && <ChecklistResults results={stepLog.checklist_results} />}
                    {stepLog.issues && stepLog.issues.length > 0 && (
                        <div className="space-y-1 pt-1 border-t">
                            <span className="text-xs font-medium text-red-600">Uygunsuzluklar</span>
                            {stepLog.issues.map((issue) => (
                                <div key={issue.id} className="flex items-center gap-1.5 text-xs">
                                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                                        {issue.severity}
                                    </Badge>
                                    <span className="text-muted-foreground">{issue.title}</span>
                                    {issue.resolved_at && (
                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">
                                            Çözüldü
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showNotes && !isCompleted && (
                <div className="ml-9 space-y-2">
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Not ekleyin..."
                        rows={2}
                        className="text-sm"
                    />
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => handleComplete('NON_COMPLIANT')}
                            disabled={isPending}
                        >
                            Uyumsuz Olarak Kaydet
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => { setShowNotes(false); setNotes('') }}
                        >
                            İptal
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export function StepChecklist({ logId, stepLogs, disabled = false }: StepChecklistProps) {
    const sorted = [...stepLogs].sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0))

    return (
        <div className="divide-y rounded-lg border">
            {sorted.map((stepLog) => (
                <StepRow
                    key={stepLog.id}
                    stepLog={stepLog}
                    logId={logId}
                    disabled={disabled}
                />
            ))}
        </div>
    )
}
