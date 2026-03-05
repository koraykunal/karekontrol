'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Box, MapPin, Wrench, Calendar, Hash, Building2, FolderTree, AlertTriangle, ClipboardList, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/status-badge'
import { useEntity } from '@/hooks/queries/use-entities'
import { useProcedures } from '@/hooks/queries/use-procedures'
import { PRIORITY_LABELS, type ProcedurePriority, type IntervalUnit } from '@/lib/constants'
import { ImagesTab } from './_components/images-tab'
import { DocumentsTab } from './_components/documents-tab'
import { HistoryTab } from './_components/history-tab'
import type { Entity, ProcedureListItem } from '@/types'

const intervalUnitLabels: Record<IntervalUnit, string> = {
    DAYS: 'gün',
    WEEKS: 'hafta',
    MONTHS: 'ay',
    YEARS: 'yıl',
}

const priorityColorMap: Record<ProcedurePriority, string> = {
    LOW: 'bg-gray-100 text-gray-700 border-gray-200',
    MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
}

export default function EntityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const entityId = parseInt(id, 10)

    const { data, isLoading } = useEntity(entityId)
    const { data: proceduresData } = useProcedures({ entity: entityId, page_size: 50 })

    const entity: Entity | undefined = data
    const procedures: ProcedureListItem[] = proceduresData?.data ?? []

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
                </div>
            </div>
        )
    }

    if (!entity) {
        return (
            <div className="flex flex-col items-center py-12">
                <p className="text-muted-foreground">Varlık bulunamadı</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/entities')}>
                    Listeye Dön
                </Button>
            </div>
        )
    }

    const detailItems = [
        { icon: Hash, label: 'Kod', value: entity.code },
        { icon: Building2, label: 'Organizasyon', value: entity.organization_name },
        { icon: FolderTree, label: 'Departman', value: entity.department_name },
        { icon: MapPin, label: 'Konum', value: entity.location },
        { icon: Wrench, label: 'Üretici', value: entity.manufacturer },
        { icon: Box, label: 'Model', value: entity.model },
        { icon: Hash, label: 'Seri No', value: entity.serial_number },
        { icon: Calendar, label: 'Oluşturulma', value: new Date(entity.created_at).toLocaleDateString('tr-TR') },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/entities')}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Geri
                </Button>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Box className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{entity.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{entity.entity_type}</Badge>
                            <StatusBadge status={entity.status} variant={entity.status === 'ACTIVE' ? 'active' : 'inactive'} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Prosedürler</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{entity.procedure_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Görseller</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{entity.images?.length ?? 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Dokümanlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{entity.documents?.length ?? 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Açık Sorunlar</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="images">Görseller</TabsTrigger>
                    <TabsTrigger value="documents">Dokümanlar</TabsTrigger>
                    <TabsTrigger value="history">Geçmiş</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Detay Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {detailItems.filter((item) => item.value).map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <div key={item.label} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Icon className="h-4 w-4" />
                                                {item.label}
                                            </div>
                                            <span className="font-medium">{item.value}</span>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>

                        {entity.qr_image && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">QR Kod</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-3">
                                    <img
                                        src={entity.qr_image}
                                        alt="QR Kod"
                                        className="h-40 w-40 rounded-md border"
                                    />
                                    {entity.qr_code && (
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {entity.qr_code}
                                        </span>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {entity.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Açıklama</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{entity.description}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ClipboardList className="h-4 w-4" />
                                Bağlı Prosedürler
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {procedures.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">Bu varlığa ait prosedür bulunamadı</p>
                            ) : (
                                <div className="divide-y">
                                    {procedures.map((proc: ProcedureListItem) => (
                                        <div key={proc.id} className="flex items-center justify-between px-6 py-3 text-sm">
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium">{proc.title}</span>
                                                <p className="text-xs text-muted-foreground">
                                                    {proc.interval_value} {intervalUnitLabels[proc.interval_unit] ?? proc.interval_unit}
                                                    {proc.total_steps !== undefined && ` · ${proc.total_steps} adım`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                                <Badge variant="outline" className={priorityColorMap[proc.priority] ?? ''}>
                                                    {PRIORITY_LABELS[proc.priority] ?? proc.priority}
                                                </Badge>
                                                {proc.is_active ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="images" className="mt-4">
                    <ImagesTab entityId={entityId} />
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                    <DocumentsTab entityId={entityId} />
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <HistoryTab entityId={entityId} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
