'use client'

import Link from 'next/link'
import { ClipboardList, ListChecks, CheckCircle2, Clock, Users, AlertTriangle, ArrowRight, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats, useManagerStats, useActivityFeed } from '@/hooks/queries/use-dashboard'
import { useIssues } from '@/hooks/queries/use-compliance'
import { usePermissions } from '@/hooks/usePermissions'
import type { DashboardStats, ManagerStats, ActivityItem } from '@/lib/api/modules/dashboard'
import type { IssueListItem } from '@/types'
import type { IssueSeverity } from '@/lib/constants'

const severityMap: Record<IssueSeverity, { label: string; className: string }> = {
    LOW: { label: 'Düşük', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    MEDIUM: { label: 'Orta', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    HIGH: { label: 'Yüksek', className: 'bg-red-100 text-red-800 border-red-200' },
    CRITICAL: { label: 'Kritik', className: 'bg-red-200 text-red-900 border-red-300' },
}

interface StatCardProps {
    label: string
    value: number | undefined
    icon: React.ElementType
    color: string
    isLoading: boolean
}

function StatCard({ label, value, icon: Icon, color, isLoading }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                ) : (
                    <div className="text-2xl font-bold">{value ?? 0}</div>
                )}
            </CardContent>
        </Card>
    )
}

function IssueSeverityBadge({ severity }: { severity: IssueSeverity }) {
    const s = severityMap[severity]
    return (
        <Badge variant="outline" className={s?.className ?? ''}>
            {s?.label ?? severity}
        </Badge>
    )
}

function relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Az önce'
    if (minutes < 60) return `${minutes}dk önce`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}s önce`
    return new Date(dateStr).toLocaleDateString('tr-TR')
}

export default function DashboardPage() {
    const { isManager } = usePermissions()
    const { data, isLoading } = useDashboardStats()
    const { data: managerStats, isLoading: managerLoading } = useManagerStats(isManager)
    const { data: activityItems } = useActivityFeed(15)
    const { data: issuesData, isLoading: issuesLoading } = useIssues({
        status: 'OPEN',
        ordering: '-created_at',
        page_size: 10,
    })

    const stats: DashboardStats | undefined = data
    const mStats: ManagerStats | undefined = managerStats

    const cards = [
        { label: 'Toplam Prosedür', value: stats?.total_procedures, icon: ClipboardList, color: 'text-blue-500' },
        { label: 'Toplam Atama', value: stats?.total_assignments, icon: ListChecks, color: 'text-indigo-500' },
        { label: 'Tamamlanan', value: stats?.completed_assignments, icon: CheckCircle2, color: 'text-emerald-500' },
        { label: 'Bekleyen', value: stats?.pending_assignments, icon: Clock, color: 'text-amber-500' },
        { label: 'Aktif Çalışan', value: stats?.active_employees, icon: Users, color: 'text-cyan-500' },
        { label: 'Açık Sorun', value: stats?.compliance_issues, icon: AlertTriangle, color: 'text-red-500' },
    ]

    const issues: IssueListItem[] = issuesData?.data ?? []
    const activity: ActivityItem[] = activityItems ?? []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Genel bakış ve özet bilgiler</p>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => (
                    <StatCard key={card.label} {...card} isLoading={isLoading} />
                ))}
            </div>

            {isManager && (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                    {managerLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
                    ) : mStats ? (
                        <>
                            <Card>
                                <CardContent className="pt-4">
                                    <p className="text-xs text-muted-foreground">Ekip Büyüklüğü</p>
                                    <p className="text-2xl font-bold">{mStats.team_size}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <p className="text-xs text-muted-foreground">Uyum Oranı</p>
                                    <p className="text-2xl font-bold text-emerald-600">{mStats.compliance_rate.toFixed(1)}%</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <p className="text-xs text-muted-foreground">Açık Sorunlar</p>
                                    <p className={`text-2xl font-bold ${mStats.open_issues > 0 ? 'text-red-600' : ''}`}>{mStats.open_issues}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <p className="text-xs text-muted-foreground">Son 30g Tamamlanan</p>
                                    <p className="text-2xl font-bold">{mStats.completed_procedures_last_30_days}</p>
                                </CardContent>
                            </Card>
                        </>
                    ) : null}
                </div>
            )}

            <div className={`grid gap-6 ${activity.length > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-1'}`}>
                <div className={activity.length > 0 ? 'lg:col-span-3' : ''}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Güncel Uyumsuzluklar</CardTitle>
                            <Link
                                href="/dashboard/compliance"
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Tümünü gör
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {issuesLoading ? (
                                <div className="space-y-2 p-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : issues.length === 0 ? (
                                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                                    Açık uyumsuzluk bulunmuyor
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {issues.map((issue) => (
                                        <div key={issue.id} className="flex items-center justify-between px-6 py-3 text-sm">
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium truncate block">{issue.title}</span>
                                                <span className="text-xs text-muted-foreground">{issue.entity_name ?? `Varlık #${issue.entity}`}</span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                                <IssueSeverityBadge severity={issue.severity} />
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(issue.created_at).toLocaleDateString('tr-TR')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {activity.length > 0 && (
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Son Aktiviteler
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y max-h-[420px] overflow-y-auto">
                                    {activity.map((item) => (
                                        <div key={item.id} className="px-4 py-3">
                                            <p className="text-sm font-medium">{item.user_name}</p>
                                            <p className="text-xs text-muted-foreground">{item.action} · {item.resource_type}</p>
                                            <p className="text-xs text-muted-foreground">{relativeTime(item.created_at)}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
