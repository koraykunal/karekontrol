'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { USER_ROLE_LABELS, UserRole } from '@/lib/constants'
import { useUser, useCreateUser, useUpdateUser } from '@/hooks/queries/use-users'
import { useOrganizationOptions } from '@/hooks/queries/use-organizations'
import { useDepartmentOptions } from '@/hooks/queries/use-departments'
import type { UserListItem, OrganizationListItem, DepartmentListItem } from '@/types'

interface UserFormData {
    email: string
    full_name: string
    phone: string
    password: string
    password_confirm: string
    role: string
    organization: string
    department: string
}

interface UserFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingUser?: UserListItem | null
}

export function UserFormDialog({ open, onOpenChange, editingUser }: UserFormDialogProps) {
    const isEditing = !!editingUser

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<UserFormData>()

    const selectedOrgId = watch('organization')

    const { data: userDetail } = useUser(editingUser?.id ?? 0, open && isEditing)
    const { data: orgsData } = useOrganizationOptions()
    const { data: deptsData } = useDepartmentOptions(selectedOrgId ? parseInt(selectedOrgId, 10) : undefined)

    useEffect(() => {
        if (open && userDetail) {
            reset({
                email: userDetail.email ?? '',
                full_name: userDetail.full_name ?? '',
                phone: userDetail.phone ?? '',
                password: '',
                password_confirm: '',
                role: userDetail.role ?? '',
                organization: String(userDetail.organization ?? ''),
                department: String(userDetail.department ?? ''),
            })
        } else if (open && !isEditing) {
            reset({ email: '', full_name: '', phone: '', password: '', password_confirm: '', role: UserRole.WORKER, organization: '', department: '' })
        }
    }, [open, userDetail, isEditing, reset])

    const createMutation = useCreateUser({ onSuccess: () => onOpenChange(false) })
    const updateMutation = useUpdateUser({ onSuccess: () => onOpenChange(false) })

    const isPending = createMutation.isPending || updateMutation.isPending

    const onSubmit = (formData: UserFormData) => {
        if (isEditing) {
            updateMutation.mutate({
                id: editingUser!.id,
                payload: {
                    full_name: formData.full_name,
                    phone: formData.phone || undefined,
                },
            })
        } else {
            createMutation.mutate({
                email: formData.email,
                full_name: formData.full_name,
                phone: formData.phone || undefined,
                password: formData.password,
                password_confirm: formData.password_confirm,
                organization: parseInt(formData.organization, 10),
                department: formData.department ? parseInt(formData.department, 10) : null,
                role: formData.role as UserRole,
            })
        }
    }

    const roleOptions = Object.entries(USER_ROLE_LABELS) as [UserRole, string][]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Ad Soyad *</Label>
                        <Input id="full_name" {...register('full_name', { required: 'Ad soyad gereklidir' })} />
                        {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta *</Label>
                        <Input id="email" type="email" disabled={isEditing} {...register('email', { required: !isEditing ? 'E-posta gereklidir' : false })} />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" {...register('phone')} />
                    </div>

                    {!isEditing && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="password">Şifre *</Label>
                                <Input id="password" type="password" {...register('password', { required: 'Şifre gereklidir', minLength: { value: 8, message: 'En az 8 karakter' } })} />
                                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirm">Şifre Tekrar *</Label>
                                <Input id="password_confirm" type="password" {...register('password_confirm', { required: 'Şifre tekrarı gereklidir', validate: (value) => value === watch('password') || 'Şifreler eşleşmiyor' })} />
                                {errors.password_confirm && <p className="text-sm text-destructive">{errors.password_confirm.message}</p>}
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select value={watch('role')} onValueChange={(v) => setValue('role', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Rol seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {roleOptions.map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Organizasyon {!isEditing && '*'}</Label>
                        <Select value={watch('organization')} onValueChange={(v) => { setValue('organization', v); setValue('department', '') }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Organizasyon seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {orgsData?.data?.map((org: OrganizationListItem) => (
                                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedOrgId && (
                        <div className="space-y-2">
                            <Label>Departman</Label>
                            <Select value={watch('department')} onValueChange={(v) => setValue('department', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Departman seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {deptsData?.data?.map((dept: DepartmentListItem) => (
                                        <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Oluştur'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
