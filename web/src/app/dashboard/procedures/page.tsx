'use client'

import { useState, useMemo } from 'react'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { usePagination } from '@/hooks/usePagination'
import { useProcedures, useDeleteProcedure } from '@/hooks/queries/use-procedures'
import { getProcedureColumns } from './_components/procedure-columns'
import { ProcedureFormDialog } from './_components/procedure-form-dialog'
import { ProcedureStepsDialog } from './_components/procedure-steps-dialog'
import { ProcedureImportDialog } from './_components/import-dialog'
import { ProcedurePriority, PRIORITY_LABELS } from '@/lib/constants'
import type { ProcedureListItem } from '@/types'

const ALL_VALUE = '__all__'

export default function ProceduresPage() {
    const { page, pageSize, search, ordering, setPage, setSearch, setOrdering } = usePagination()

    const [priorityFilter, setPriorityFilter] = useState<string>(ALL_VALUE)
    const [isActiveFilter, setIsActiveFilter] = useState<string>(ALL_VALUE)

    const [formOpen, setFormOpen] = useState(false)
    const [importOpen, setImportOpen] = useState(false)
    const [editingProcedure, setEditingProcedure] = useState<ProcedureListItem | null>(null)
    const [stepsDialogId, setStepsDialogId] = useState<number | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<ProcedureListItem | null>(null)

    const queryParams: Record<string, unknown> = {
        page,
        page_size: pageSize,
        ordering,
        ...(search ? { search } : {}),
        ...(priorityFilter !== ALL_VALUE ? { priority: priorityFilter } : {}),
        ...(isActiveFilter !== ALL_VALUE ? { is_active: isActiveFilter === 'true' } : {}),
    }

    const { data, isLoading } = useProcedures(queryParams)

    const deleteMutation = useDeleteProcedure({ onSuccess: () => setDeleteTarget(null) })

    const columns = useMemo(
        () =>
            getProcedureColumns({
                onEdit: (proc) => {
                    setEditingProcedure(proc)
                    setFormOpen(true)
                },
                onManageSteps: (proc) => setStepsDialogId(proc.id),
                onDelete: (proc) => setDeleteTarget(proc),
            }),
        []
    )

    const handleFormClose = (open: boolean) => {
        setFormOpen(open)
        if (!open) setEditingProcedure(null)
    }

    const toolbar = (
        <>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Öncelik" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_VALUE}>Tüm Öncelikler</SelectItem>
                    {Object.values(ProcedurePriority).map((p) => (
                        <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
                <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_VALUE}>Tümü</SelectItem>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Pasif</SelectItem>
                </SelectContent>
            </Select>
        </>
    )

    return (
        <div className="space-y-6">
            <PageHeader
                title="Prosedürler"
                description="Bakım ve kontrol prosedürlerini yönetin"
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setImportOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Toplu Yükle
                        </Button>
                        <Button onClick={() => setFormOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Prosedür
                        </Button>
                    </div>
                }
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
                searchPlaceholder="Prosedür ara..."
                emptyMessage="Prosedür bulunamadı"
                toolbar={toolbar}
            />

            <ProcedureFormDialog
                open={formOpen}
                onOpenChange={handleFormClose}
                editingProcedure={editingProcedure}
            />

            <ProcedureStepsDialog
                procedureId={stepsDialogId}
                open={stepsDialogId !== null}
                onOpenChange={(open) => { if (!open) setStepsDialogId(null) }}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title="Prosedürü Sil"
                description={`"${deleteTarget?.title}" prosedürünü silmek istediğinizden emin misiniz?`}
                variant="danger"
                confirmLabel="Sil"
                isLoading={deleteMutation.isPending}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            />

            <ProcedureImportDialog
                open={importOpen}
                onOpenChange={setImportOpen}
            />
        </div>
    )
}
