'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useReport } from '@/hooks/queries/use-reports'
import { reportsApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import { REPORT_TYPE_LABELS, REPORT_STATUS_LABELS } from '@/lib/constants'

const statusColorMap: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
    GENERATING: 'bg-blue-100 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    FAILED: 'bg-red-100 text-red-700 border-red-200',
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const reportId = parseInt(id, 10)
    const { data: report, isLoading } = useReport(reportId)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!report || report.status !== 'COMPLETED' || !report.file) return

        let url: string | null = null
        reportsApi.download(report.id)
            .then((blob) => {
                url = URL.createObjectURL(blob)
                setPdfUrl(url)
            })
            .catch(() => setPdfUrl(null))

        return () => { if (url) URL.revokeObjectURL(url) }
    }, [report?.id, report?.status, report?.file])

    const handleDownload = async () => {
        if (!report) return
        try {
            const blob = await reportsApi.download(report.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${report.title}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            handleApiError(error, 'PDF indirilemedi')
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                </div>
                <Skeleton className="h-96" />
            </div>
        )
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center py-12">
                <p className="text-muted-foreground">Rapor bulunamadı</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/reports')}>
                    Listeye Dön
                </Button>
            </div>
        )
    }

    const isGenerating = report.status === 'PENDING' || report.status === 'GENERATING'
    const isReady = report.status === 'COMPLETED'
    const isFailed = report.status === 'FAILED'
    const completionRate = report.total_procedures > 0
        ? Math.round((report.completed_procedures / report.total_procedures) * 100)
        : 0

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/reports')}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Geri
                </Button>
                <div className="flex flex-1 items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{report.title}</h1>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{report.organization_name}</span>
                                {report.department_name && <span>{report.department_name}</span>}
                                <Badge variant="outline" className={statusColorMap[report.status] ?? ''}>
                                    {REPORT_STATUS_LABELS[report.status as keyof typeof REPORT_STATUS_LABELS] ?? report.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    {isReady && (
                        <Button size="sm" onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            PDF İndir
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-xs uppercase text-muted-foreground tracking-wide">Tür</p>
                        <p className="mt-1 text-lg font-semibold">
                            {REPORT_TYPE_LABELS[report.report_type as keyof typeof REPORT_TYPE_LABELS] ?? report.report_type}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-xs uppercase text-muted-foreground tracking-wide">Dönem</p>
                        <p className="mt-1 text-lg font-semibold">
                            {report.period_month}/{report.period_year}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-xs uppercase text-muted-foreground tracking-wide">Tamamlanma</p>
                        <p className="mt-1 text-lg font-semibold">
                            {report.completed_procedures}/{report.total_procedures}
                            <span className="ml-2 text-sm text-muted-foreground">(%{completionRate})</span>
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-xs uppercase text-muted-foreground tracking-wide">Uygunsuzluk</p>
                        <p className={`mt-1 text-lg font-semibold ${report.non_compliance_count > 0 ? 'text-red-600' : ''}`}>
                            {report.non_compliance_count}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
                    {report.generated_by_name && (
                        <p>Oluşturan: <span className="font-medium text-foreground">{report.generated_by_name}</span></p>
                    )}
                    <p>
                        Oluşturma Tarihi: <span className="font-medium text-foreground">
                            {new Date(report.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </p>
                    {report.file_size != null && report.file_size > 0 && (
                        <p>Dosya Boyutu: <span className="font-medium text-foreground">{(report.file_size / 1024).toFixed(0)} KB</span></p>
                    )}
                </CardContent>
            </Card>

            {isGenerating && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">Rapor oluşturuluyor...</p>
                        <p className="text-xs text-muted-foreground">Bu sayfa otomatik olarak güncellenecek</p>
                    </CardContent>
                </Card>
            )}

            {isFailed && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                        <p className="font-medium text-red-700">Rapor oluşturma başarısız</p>
                        {report.error_message && (
                            <p className="mt-1 text-sm text-red-600">{report.error_message}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {isReady && report.file && (
                <Card>
                    <CardContent className="p-0">
                        {pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                className="w-full border-0 rounded-lg"
                                style={{ height: '80vh' }}
                                title="PDF Önizleme"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">PDF yükleniyor...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
