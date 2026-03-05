'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useProcedureLogs } from '@/hooks/queries/use-execution'
import { PROCEDURE_LOG_STATUS_LABELS, type ProcedureLogStatus } from '@/lib/constants'

const statusVariants: Record<ProcedureLogStatus, string> = {
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
}

interface ExecutionsSectionProps {
    procedureId: number
}

export function ExecutionsSection({ procedureId }: ExecutionsSectionProps) {
    const { data, isLoading } = useProcedureLogs({ procedure: procedureId, page_size: 10 })
    const logs = data?.data ?? []

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle className="text-base">Son Yürütmeler</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Son Yürütmeler</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {logs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Henüz yürütme kaydı yok</p>
                ) : (
                    <div className="divide-y">
                        {logs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between px-6 py-3 text-sm">
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{log.entity_name ?? '—'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {log.user_name ?? 'Bilinmiyor'}
                                        {' · '}
                                        {new Date(log.started_at).toLocaleDateString('tr-TR')}
                                        {log.completed_at && ` → ${new Date(log.completed_at).toLocaleDateString('tr-TR')}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                    <Badge variant="outline" className={statusVariants[log.status] ?? ''}>
                                        {PROCEDURE_LOG_STATUS_LABELS[log.status] ?? log.status}
                                    </Badge>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                        <Link href={`/dashboard/execution/${log.id}`}>
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
