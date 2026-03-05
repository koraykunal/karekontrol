'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { useProcedureLogs } from '@/hooks/queries/use-execution'
import { PROCEDURE_LOG_STATUS_LABELS } from '@/lib/constants'
import { getExecutionColumns } from './_components/execution-columns'
import { StartExecutionDialog } from './_components/start-execution-dialog'

const STATUS_OPTIONS = [
    { value: 'all', label: 'Tümü' },
    { value: 'IN_PROGRESS', label: PROCEDURE_LOG_STATUS_LABELS.IN_PROGRESS },
    { value: 'COMPLETED', label: PROCEDURE_LOG_STATUS_LABELS.COMPLETED },
    { value: 'CANCELLED', label: PROCEDURE_LOG_STATUS_LABELS.CANCELLED },
]

export default function ExecutionPage() {
    const [page, setPage] = useState(1)
    const [status, setStatus] = useState('all')
    const [startOpen, setStartOpen] = useState(false)

    const params: Record<string, unknown> = { page, page_size: 20 }
    if (status !== 'all') params.status = status

    const { data, isLoading } = useProcedureLogs(params)
    const logs = data?.data ?? []
    const totalPages = data?.total_pages ?? 0

    const columns = getExecutionColumns()

    return (
        <div className="space-y-6">
            <PageHeader
                title="İş Yürütme"
                description="Prosedür yürütme kayıtları ve takibi"
                action={
                    <Button onClick={() => setStartOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Yürütme Başlat
                    </Button>
                }
            />

            <div className="flex items-center gap-3">
                <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1) }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                data={logs}
                isLoading={isLoading}
                emptyMessage="Yürütme kaydı bulunamadı"
                totalCount={data?.total ?? 0}
                page={page}
                pageSize={20}
                onPageChange={setPage}
            />

            <StartExecutionDialog open={startOpen} onOpenChange={setStartOpen} />
        </div>
    )
}
