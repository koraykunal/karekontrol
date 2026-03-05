'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ClipboardList, Clock, FileText, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useProcedureLog, useCompleteProcedureLog, useCancelProcedureLog } from '@/hooks/queries/use-execution'
import { useGenerateProcedureReport } from '@/hooks/queries/use-reports'
import { useAuthStore } from '@/store/auth'
import { PROCEDURE_LOG_STATUS_LABELS } from '@/lib/constants'
import { StepChecklist } from './_components/step-checklist'

export default function ExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const logId = parseInt(id, 10)
    const [cancelOpen, setCancelOpen] = useState(false)
    const user = useAuthStore((s) => s.user)
    const canGenerateReport = user?.role ? ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role) : false

    const { data: log, isLoading } = useProcedureLog(logId)
    const completeMutation = useCompleteProcedureLog({
        onSuccess: () => router.push('/dashboard/execution'),
    })
    const cancelMutation = useCancelProcedureLog({
        onSuccess: () => router.push('/dashboard/execution'),
    })
    const generateReportMutation = useGenerateProcedureReport({
        onSuccess: (report) => router.push(`/dashboard/reports/${report.id}`),
    })

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-64" />
            </div>
        )
    }

    if (!log) {
        return (
            <div className="flex flex-col items-center py-12">
                <p className="text-muted-foreground">Yürütme kaydı bulunamadı</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/execution')}>
                    Listeye Dön
                </Button>
            </div>
        )
    }

    const isActive = log.status === 'IN_PROGRESS'
    const allStepsDone = log.completion_percentage === 100
    const stepLogs = log.step_logs ?? []

    const statusColorMap: Record<string, string> = {
        IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
        COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/execution')}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Geri
                </Button>
                <div className="flex flex-1 items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {log.procedure_title ?? log.procedure?.title ?? `Prosedür #${log.procedure_id}`}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{log.entity_name ?? log.entity?.name ?? `Varlık #${log.entity_id}`}</span>
                                <Badge variant="outline" className={statusColorMap[log.status] ?? ''}>
                                    {PROCEDURE_LOG_STATUS_LABELS[log.status] ?? log.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    {isActive && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => completeMutation.mutate(logId)}
                                disabled={!allStepsDone || completeMutation.isPending}
                            >
                                Yürütmeyi Tamamla
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCancelOpen(true)}
                                className="text-destructive border-destructive/30 hover:bg-destructive/5"
                            >
                                İptal Et
                            </Button>
                        </div>
                    )}
                    {log.status === 'COMPLETED' && canGenerateReport && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => generateReportMutation.mutate(logId)}
                            disabled={generateReportMutation.isPending}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            {generateReportMutation.isPending ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardContent className="pt-4 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">İlerleme</span>
                            <span className="font-medium">{log.completion_percentage}%</span>
                        </div>
                        <Progress value={log.completion_percentage} className="h-2" />
                        {log.completed_steps != null && log.total_steps != null && (
                            <p className="text-xs text-muted-foreground">
                                {log.completed_steps} / {log.total_steps} adım tamamlandı
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{log.user_name ?? 'Bilinmiyor'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                                Başlangıç: {new Date(log.started_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        {log.completed_at && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                    Tamamlandı: {new Date(log.completed_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
                        {log.duration_formatted && log.duration_formatted !== 'N/A' && (
                            <p className="text-xs text-muted-foreground">Toplam Süre: {log.duration_formatted}</p>
                        )}
                        {log.compliance_rate != null && log.compliance_rate > 0 && (
                            <p className="text-xs text-muted-foreground">Uyum Oranı: %{log.compliance_rate}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {stepLogs.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Adımlar ({stepLogs.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <StepChecklist
                            logId={logId}
                            stepLogs={stepLogs}
                            disabled={!isActive}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                        Bu prosedüre ait adım bulunmuyor
                    </CardContent>
                </Card>
            )}

            <ConfirmDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                title="Yürütmeyi İptal Et"
                description="Bu yürütme kalıcı olarak iptal edilecek. Devam etmek istiyor musunuz?"
                onConfirm={() => cancelMutation.mutate(logId)}
                isLoading={cancelMutation.isPending}
            />
        </div>
    )
}
