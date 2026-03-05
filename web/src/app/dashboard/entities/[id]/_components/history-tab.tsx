'use client'

import { useState } from 'react'
import Link from 'next/link'
import { History, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEntityHistory } from '@/hooks/queries/use-entities'
import { PROCEDURE_LOG_STATUS_LABELS, ProcedureLogStatus } from '@/lib/constants'

const statusVariants: Record<ProcedureLogStatus, string> = {
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

interface HistoryTabProps {
    entityId: number
}

export function HistoryTab({ entityId }: HistoryTabProps) {
    const [page, setPage] = useState(1)
    const { data, isLoading } = useEntityHistory(entityId, { page, page_size: 10 })

    const logs = data?.data ?? []
    const totalPages = data?.total_pages ?? 0

    if (isLoading) {
        return <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}</div>
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <History className="h-10 w-10 opacity-30" />
                <p className="text-sm">Bu varlık için tamamlanmış yürütme bulunmuyor</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="divide-y rounded-lg border">
                {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{log.procedure_title ?? `Prosedür #${log.procedure_id}`}</p>
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

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Önceki
                    </Button>
                    <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Sonraki
                    </Button>
                </div>
            )}
        </div>
    )
}
