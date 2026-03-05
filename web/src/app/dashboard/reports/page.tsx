'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { useReports } from '@/hooks/queries/use-reports'
import { REPORT_TYPE_LABELS, type ReportType } from '@/lib/constants'
import { useAuthStore } from '@/store/auth'
import { getReportColumns } from './_components/report-columns'
import { GenerateReportDialog } from './_components/generate-report-dialog'

const TYPE_OPTIONS = [
    { value: 'all', label: 'Tüm Türler' },
    ...Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER']

export default function ReportsPage() {
    const user = useAuthStore((s) => s.user)
    const canCreate = user?.role ? MANAGER_ROLES.includes(user.role) : false
    const [page, setPage] = useState(1)
    const [reportType, setReportType] = useState('all')
    const [generateOpen, setGenerateOpen] = useState(false)

    const params: Record<string, unknown> = { page, page_size: 20 }
    if (reportType !== 'all') params.report_type = reportType

    const { data, isLoading } = useReports(params)
    const reports = data?.data ?? []

    const columns = getReportColumns()

    return (
        <div className="space-y-6">
            <PageHeader
                title="Raporlar"
                description="Uyumluluk ve prosedür raporları"
                action={canCreate ? (
                    <Button onClick={() => setGenerateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Rapor Oluştur
                    </Button>
                ) : undefined}
            />

            <div className="flex items-center gap-3">
                <Select value={reportType} onValueChange={(val) => { setReportType(val); setPage(1) }}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                data={reports}
                isLoading={isLoading}
                emptyMessage="Rapor bulunamadı"
                totalCount={data?.total ?? 0}
                page={page}
                pageSize={20}
                onPageChange={setPage}
            />

            <GenerateReportDialog open={generateOpen} onOpenChange={setGenerateOpen} />
        </div>
    )
}
