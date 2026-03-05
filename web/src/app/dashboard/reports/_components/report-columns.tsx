'use client'

import Link from 'next/link'
import { Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { REPORT_TYPE_LABELS, REPORT_STATUS_LABELS, type ReportType, type ReportStatus } from '@/lib/constants'
import { reportsApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import type { Column } from '@/components/shared/data-table'
import type { ReportListItem } from '@/types'

const statusVariants: Partial<Record<ReportStatus, string>> = {
    PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
    GENERATING: 'bg-blue-100 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    FAILED: 'bg-red-100 text-red-700 border-red-200',
}

async function handleDownload(id: number, title: string) {
    try {
        const blob = await reportsApi.download(id)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title}.pdf`
        a.click()
        URL.revokeObjectURL(url)
    } catch (error) {
        handleApiError(error, 'PDF indirilemedi')
    }
}

export function getReportColumns(): Column<ReportListItem>[] {
    return [
        {
            key: 'title',
            label: 'Rapor',
            render: (r) => (
                <Link href={`/dashboard/reports/${r.id}`} className="block hover:underline">
                    <span className="font-medium">{r.title}</span>
                    <p className="text-xs text-muted-foreground">
                        {REPORT_TYPE_LABELS[r.report_type as ReportType] ?? r.report_type}
                    </p>
                </Link>
            ),
        },
        {
            key: 'period_year',
            label: 'Dönem',
            className: 'w-[100px]',
            render: (r) => (
                <span className="text-sm text-muted-foreground">
                    {r.period_month ? `${r.period_month}/${r.period_year}` : r.period_year}
                </span>
            ),
        },
        {
            key: 'completed_procedures',
            label: 'Uyum',
            className: 'w-[90px]',
            render: (r) => (
                <span className="text-sm text-muted-foreground">
                    {r.completed_procedures}/{r.total_procedures}
                </span>
            ),
        },
        {
            key: 'non_compliance_count',
            label: 'Uyumsuzluk',
            className: 'w-[100px]',
            render: (r) => (
                <span className={`text-sm font-medium ${r.non_compliance_count > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {r.non_compliance_count}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Durum',
            className: 'w-[110px]',
            render: (r) => (
                <Badge variant="outline" className={statusVariants[r.status as ReportStatus] ?? ''}>
                    {REPORT_STATUS_LABELS[r.status as ReportStatus] ?? r.status}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: 'Oluşturulma',
            className: 'w-[110px]',
            render: (r) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('tr-TR')}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (r) =>
                r.status === 'COMPLETED' ? (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleDownload(r.id, r.title)}
                        title="İndir"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                ) : null,
        },
    ]
}
