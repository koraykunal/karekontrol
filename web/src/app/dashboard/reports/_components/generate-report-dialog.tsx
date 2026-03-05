'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateReport } from '@/hooks/queries/use-reports'
import { useDepartmentOptions } from '@/hooks/queries/use-departments'
import { useAuthStore } from '@/store/auth'

const MONTH_NAMES = [
    { value: '1', label: 'Ocak' },
    { value: '2', label: 'Şubat' },
    { value: '3', label: 'Mart' },
    { value: '4', label: 'Nisan' },
    { value: '5', label: 'Mayıs' },
    { value: '6', label: 'Haziran' },
    { value: '7', label: 'Temmuz' },
    { value: '8', label: 'Ağustos' },
    { value: '9', label: 'Eylül' },
    { value: '10', label: 'Ekim' },
    { value: '11', label: 'Kasım' },
    { value: '12', label: 'Aralık' },
]

const REPORT_TYPES = [
    { value: 'ORGANIZATION', label: 'Organizasyon Raporu' },
] as const

const schema = z.object({
    report_type: z.string().min(1, 'Rapor türü seçiniz'),
    period_year: z.number().min(2020).max(2099),
    period_month: z.string().min(1, 'Ay seçiniz'),
    department: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface GenerateReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function GenerateReportDialog({ open, onOpenChange }: GenerateReportDialogProps) {
    const user = useAuthStore((s) => s.user)
    const { data: depsData } = useDepartmentOptions(user?.organization ?? undefined)
    const createMutation = useCreateReport({ onSuccess: () => onOpenChange(false) })

    const departments = depsData?.data ?? []

    const now = new Date()

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            report_type: 'ORGANIZATION',
            period_year: now.getFullYear(),
            period_month: String(now.getMonth() === 0 ? 12 : now.getMonth()),
            department: '',
        },
    })

    function handleSubmit(values: FormData) {
        createMutation.mutate({
            report_type: values.report_type,
            period_year: values.period_year,
            period_month: parseInt(values.period_month, 10),
            department: values.department ? parseInt(values.department, 10) : undefined,
        })
    }

    function handleOpenChange(open: boolean) {
        if (!open) form.reset()
        onOpenChange(open)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rapor Oluştur</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="report_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rapor Türü</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seçin" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {REPORT_TYPES.map(({ value, label }) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="period_year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Yıl</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                value={field.value}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="period_month"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ay</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Ay seçin" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {MONTH_NAMES.map(({ value, label }) => (
                                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {departments.length > 0 && (
                            <FormField
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Departman (opsiyonel)</FormLabel>
                                        <Select value={field.value || 'all'} onValueChange={(v) => field.onChange(v === 'all' ? '' : v)}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tüm departmanlar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">Tüm departmanlar</SelectItem>
                                                {departments.map((d) => (
                                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>İptal</Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
