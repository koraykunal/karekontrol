'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useSendSystemNotification } from '@/hooks/queries/use-notifications'
import { useDepartmentOptions } from '@/hooks/queries/use-departments'
import { useUsers } from '@/hooks/queries/use-users'
import { useAuthStore } from '@/store/auth'

const schema = z.object({
    title: z.string().min(1, 'Başlık zorunludur').max(255),
    message: z.string().min(1, 'Mesaj zorunludur'),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
    target: z.enum(['all', 'department', 'users']),
    department_id: z.number().optional(),
    user_ids: z.array(z.number()).optional(),
    action_url: z.string().max(500).optional().or(z.literal('')),
}).refine((data) => {
    if (data.target === 'department' && !data.department_id) return false
    if (data.target === 'users' && (!data.user_ids || data.user_ids.length === 0)) return false
    return true
}, {
    message: 'Hedef için gerekli alan seçilmelidir',
    path: ['target'],
})

type FormData = z.infer<typeof schema>

const PRIORITY_OPTIONS = [
    { value: 'LOW', label: 'Düşük' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'Yüksek' },
    { value: 'URGENT', label: 'Acil' },
]

const TARGET_OPTIONS = [
    { value: 'all', label: 'Tüm Organizasyon' },
    { value: 'department', label: 'Departman' },
    { value: 'users', label: 'Kullanıcılar' },
]

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SendNotificationDialog({ open, onOpenChange }: Props) {
    const user = useAuthStore((s) => s.user)
    const orgId = user?.organization ?? 0

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '',
            message: '',
            priority: 'NORMAL',
            target: 'all',
            department_id: undefined,
            user_ids: [],
            action_url: '',
        },
    })

    const target = form.watch('target')

    const { data: departmentsData } = useDepartmentOptions(target === 'department' ? orgId : undefined)
    const { data: usersData } = useUsers(target === 'users' ? { page_size: 100 } : {})

    const departments = departmentsData?.data ?? []
    const users = usersData?.data ?? []

    const sendMutation = useSendSystemNotification({
        onSuccess: () => {
            form.reset()
            onOpenChange(false)
        },
    })

    useEffect(() => {
        if (!open) form.reset()
    }, [open, form])

    useEffect(() => {
        form.setValue('department_id', undefined)
        form.setValue('user_ids', [])
    }, [target, form])

    function onSubmit(data: FormData) {
        const payload: Record<string, unknown> = {
            title: data.title,
            message: data.message,
            priority: data.priority,
            target: data.target,
        }
        if (data.target === 'department') payload.department_id = data.department_id
        if (data.target === 'users') payload.user_ids = data.user_ids
        if (data.action_url) payload.action_url = data.action_url

        sendMutation.mutate(payload as Parameters<typeof sendMutation.mutate>[0])
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Sistem Bildirimi Gönder</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Başlık</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Bildirim başlığı" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mesaj</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Bildirim mesajı" rows={3} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Öncelik</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PRIORITY_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="target"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hedef</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {TARGET_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {target === 'department' && (
                            <FormField
                                control={form.control}
                                name="department_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Departman</FormLabel>
                                        <Select
                                            value={field.value?.toString() ?? ''}
                                            onValueChange={(val) => field.onChange(Number(val))}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Departman seçin" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departments.map((dept: { id: number; name: string }) => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {target === 'users' && (
                            <div className="space-y-2">
                                <Label>Kullanıcılar</Label>
                                <div className="max-h-48 overflow-y-auto rounded-md border p-3 space-y-2">
                                    {users.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Kullanıcı bulunamadı</p>
                                    ) : (
                                        users.map((u: { id: number; full_name: string; email: string }) => (
                                            <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded"
                                                    checked={form.watch('user_ids')?.includes(u.id) ?? false}
                                                    onChange={(e) => {
                                                        const current = form.getValues('user_ids') ?? []
                                                        if (e.target.checked) {
                                                            form.setValue('user_ids', [...current, u.id])
                                                        } else {
                                                            form.setValue('user_ids', current.filter((id) => id !== u.id))
                                                        }
                                                    }}
                                                />
                                                <span>{u.full_name}</span>
                                                <span className="text-muted-foreground">({u.email})</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                {form.formState.errors.target && (
                                    <p className="text-sm text-destructive">{form.formState.errors.target.message}</p>
                                )}
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="action_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Aksiyon URL (Opsiyonel)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="/dashboard/..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={sendMutation.isPending}>
                                {sendMutation.isPending ? 'Gönderiliyor...' : 'Gönder'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
