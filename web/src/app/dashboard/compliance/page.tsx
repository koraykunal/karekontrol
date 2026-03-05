'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { usePagination } from '@/hooks/usePagination'
import { useIssues } from '@/hooks/queries/use-compliance'
import { getIssueColumns } from './_components/issue-columns'
import { IssueDetailDialog } from './_components/issue-detail-dialog'
import { IssueStatus, IssueSeverity, ISSUE_STATUS_LABELS } from '@/lib/constants'
import type { IssueListItem } from '@/types'

const ALL_VALUE = '__all__'

export default function CompliancePage() {
    const { page, pageSize, search, ordering, setPage, setSearch, setOrdering } = usePagination()

    const [statusFilter, setStatusFilter] = useState<string>(ALL_VALUE)
    const [severityFilter, setSeverityFilter] = useState<string>(ALL_VALUE)
    const [selectedIssue, setSelectedIssue] = useState<IssueListItem | null>(null)
    const [resolveMode, setResolveMode] = useState(false)

    const queryParams: Record<string, unknown> = {
        page,
        page_size: pageSize,
        ordering,
        ...(search ? { search } : {}),
        ...(statusFilter !== ALL_VALUE ? { status: statusFilter } : {}),
        ...(severityFilter !== ALL_VALUE ? { severity: severityFilter } : {}),
    }

    const { data, isLoading } = useIssues(queryParams)

    const columns = useMemo(
        () =>
            getIssueColumns({
                onView: (issue) => {
                    setResolveMode(false)
                    setSelectedIssue(issue)
                },
                onResolve: (issue) => {
                    setResolveMode(true)
                    setSelectedIssue(issue)
                },
            }),
        []
    )

    const toolbar = (
        <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_VALUE}>Tüm Durumlar</SelectItem>
                    {Object.values(IssueStatus).map((s) => (
                        <SelectItem key={s} value={s}>{ISSUE_STATUS_LABELS[s]}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Şiddet" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_VALUE}>Tüm Şiddetler</SelectItem>
                    <SelectItem value={IssueSeverity.LOW}>Düşük</SelectItem>
                    <SelectItem value={IssueSeverity.MEDIUM}>Orta</SelectItem>
                    <SelectItem value={IssueSeverity.HIGH}>Yüksek</SelectItem>
                    <SelectItem value={IssueSeverity.CRITICAL}>Kritik</SelectItem>
                </SelectContent>
            </Select>
        </>
    )

    return (
        <div className="space-y-6">
            <PageHeader
                title="Uygunsuzluklar"
                description="Uyumsuzluk sorunlarını takip edin ve yönetin"
            />

            <DataTable
                columns={columns}
                data={data?.data ?? []}
                isLoading={isLoading}
                totalCount={data?.total ?? 0}
                page={page}
                pageSize={pageSize}
                search={search}
                ordering={ordering}
                onPageChange={setPage}
                onSearchChange={setSearch}
                onSortChange={setOrdering}
                searchPlaceholder="Uyumsuzluk ara..."
                emptyMessage="Uyumsuzluk bulunamadı"
                toolbar={toolbar}
            />

            <IssueDetailDialog
                issue={selectedIssue}
                open={!!selectedIssue}
                onOpenChange={(open) => {
                    if (!open) setSelectedIssue(null)
                }}
                initialResolve={resolveMode}
            />
        </div>
    )
}
