'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
    useDepartments,
    useDepartment,
    useCreateDepartment,
    useUpdateDepartment,
    useDeleteDepartment,
} from '@/hooks/queries/use-departments'
import type { DepartmentListItem } from '@/types'

interface DepartmentSectionProps {
    organizationId: number
}

interface DeptFormData {
    name: string
    description: string
    code: string
}

export function DepartmentSection({ organizationId }: DepartmentSectionProps) {
    const [formOpen, setFormOpen] = useState(false)
    const [editingDept, setEditingDept] = useState<DepartmentListItem | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<DepartmentListItem | null>(null)

    const { data, isLoading } = useDepartments(organizationId)
    const { data: deptDetail } = useDepartment(editingDept?.id ?? 0, formOpen && !!editingDept)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DeptFormData>()

    useEffect(() => {
        if (formOpen && deptDetail) {
            reset({
                name: deptDetail.name ?? '',
                description: deptDetail.description ?? '',
                code: deptDetail.code ?? '',
            })
        } else if (formOpen && !editingDept) {
            reset({ name: '', description: '', code: '' })
        }
    }, [formOpen, deptDetail, editingDept, reset])

    const handleFormClose = () => {
        setFormOpen(false)
        setEditingDept(null)
    }

    const createMutation = useCreateDepartment(organizationId, { onSuccess: handleFormClose })
    const updateMutation = useUpdateDepartment(organizationId, { onSuccess: handleFormClose })
    const deleteMutation = useDeleteDepartment(organizationId, { onSuccess: () => setDeleteTarget(null) })

    const isFormPending = createMutation.isPending || updateMutation.isPending

    const onSubmit = (formData: DeptFormData) => {
        const payload = {
            organization: organizationId,
            name: formData.name,
            description: formData.description || undefined,
            code: formData.code || undefined,
        }

        if (editingDept) {
            updateMutation.mutate({ id: editingDept.id, payload })
        } else {
            createMutation.mutate(payload)
        }
    }

    const departments = data?.data ?? []

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Departmanlar</CardTitle>
                <Button size="sm" onClick={() => setFormOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Ekle
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>İsim</TableHead>
                            <TableHead className="w-[120px]">Kod</TableHead>
                            <TableHead className="w-[160px]">Yönetici</TableHead>
                            <TableHead className="w-[60px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                </TableRow>
                            ))
                        ) : departments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                                    Henüz departman eklenmemiş
                                </TableCell>
                            </TableRow>
                        ) : (
                            departments.map((dept: DepartmentListItem) => (
                                <TableRow key={dept.id}>
                                    <TableCell className="font-medium">{dept.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{dept.code ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{dept.manager_name ?? '—'}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => { setEditingDept(dept); setFormOpen(true) }}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeleteTarget(dept)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={formOpen} onOpenChange={(open) => { if (!open) handleFormClose() }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingDept ? 'Departmanı Düzenle' : 'Yeni Departman'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="dept-name">İsim *</Label>
                            <Input id="dept-name" {...register('name', { required: 'İsim gereklidir' })} />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dept-code">Kod</Label>
                            <Input id="dept-code" {...register('code')} placeholder="HR, IT, FIN..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dept-desc">Açıklama</Label>
                            <Input id="dept-desc" {...register('description')} />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={handleFormClose}>İptal</Button>
                            <Button type="submit" disabled={isFormPending}>
                                {isFormPending ? 'Kaydediliyor...' : editingDept ? 'Güncelle' : 'Oluştur'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title="Departmanı Sil"
                description={`"${deleteTarget?.name}" departmanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                variant="danger"
                confirmLabel="Sil"
                isLoading={deleteMutation.isPending}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            />
        </Card>
    )
}
