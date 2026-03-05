'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ClipboardList, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useProcedure, useUpdateProcedure } from '@/hooks/queries/use-procedures'
import { PRIORITY_LABELS, type ProcedurePriority, type IntervalUnit } from '@/lib/constants'
import { StepsSection } from './_components/steps-section'
import { ExecutionsSection } from './_components/executions-section'

const priorityColorMap: Record<ProcedurePriority, string> = {
    LOW: 'bg-gray-100 text-gray-700 border-gray-200',
    MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
}

const intervalUnitLabels: Record<IntervalUnit, string> = {
    DAYS: 'gün',
    WEEKS: 'hafta',
    MONTHS: 'ay',
    YEARS: 'yıl',
}

export default function ProcedureDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const procedureId = parseInt(id, 10)

    const { data: procedure, isLoading } = useProcedure(procedureId)
    const updateMutation = useUpdateProcedure()

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        )
    }

    if (!procedure) {
        return (
            <div className="flex flex-col items-center py-12">
                <p className="text-muted-foreground">Prosedür bulunamadı</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/procedures')}>
                    Listeye Dön
                </Button>
            </div>
        )
    }

    function toggleActive() {
        updateMutation.mutate({ id: procedureId, payload: { is_active: !procedure!.is_active } })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/procedures')}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Geri
                </Button>
                <div className="flex flex-1 items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{procedure.title}</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className={priorityColorMap[procedure.priority] ?? ''}>
                                    {PRIORITY_LABELS[procedure.priority] ?? procedure.priority}
                                </Badge>
                                <span>·</span>
                                <span>{procedure.entity_name ?? `Varlık #${procedure.entity}`}</span>
                                <span>·</span>
                                <span>{procedure.interval_value} {intervalUnitLabels[procedure.interval_unit] ?? procedure.interval_unit}</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleActive}
                        disabled={updateMutation.isPending}
                        className={procedure.is_active ? 'text-emerald-600 border-emerald-200' : 'text-muted-foreground'}
                    >
                        {procedure.is_active ? (
                            <><CheckCircle2 className="mr-1.5 h-4 w-4" />Aktif</>
                        ) : (
                            <><XCircle className="mr-1.5 h-4 w-4" />Pasif</>
                        )}
                    </Button>
                </div>
            </div>

            {procedure.description && (
                <p className="text-sm text-muted-foreground">{procedure.description}</p>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <StepsSection procedureId={procedureId} />
                <ExecutionsSection procedureId={procedureId} />
            </div>
        </div>
    )
}
