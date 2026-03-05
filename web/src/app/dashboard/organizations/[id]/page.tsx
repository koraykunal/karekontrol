'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users, FolderTree, Mail, Phone, MapPin, Calendar, Hash, FileText, QrCode, Pencil, RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/shared/status-badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOrganization, useOrganizationQuota, useUpdateQuota, useResetSandbox } from '@/hooks/queries/use-organizations'
import { useAuthStore } from '@/store/auth'
import { DepartmentSection } from '../_components/department-section'
import type { Organization } from '@/types'

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const orgId = parseInt(id, 10)
    const user = useAuthStore((s) => s.user)

    const { data, isLoading } = useOrganization(orgId)
    const { data: quotaData } = useOrganizationQuota(orgId)
    const [quotaDialogOpen, setQuotaDialogOpen] = useState(false)
    const [newQuota, setNewQuota] = useState(0)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [resetPassword, setResetPassword] = useState('')
    const [resetConfirmText, setResetConfirmText] = useState('')

    const updateQuotaMutation = useUpdateQuota({
        onSuccess: () => setQuotaDialogOpen(false),
    })

    const resetMutation = useResetSandbox({
        onSuccess: () => {
            setResetDialogOpen(false)
            setResetPassword('')
            setResetConfirmText('')
        },
    })

    const org: Organization | undefined = data

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
                </div>
                <Skeleton className="h-64" />
            </div>
        )
    }

    if (!org) {
        return (
            <div className="flex flex-col items-center py-12">
                <p className="text-muted-foreground">Organizasyon bulunamadı</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/organizations')}>
                    Listeye Dön
                </Button>
            </div>
        )
    }

    const isSuperAdmin = user?.role === 'SUPER_ADMIN'
    const quotaPercent = quotaData && !quotaData.is_unlimited && quotaData.qr_quota > 0
        ? Math.round((quotaData.entity_count / quotaData.qr_quota) * 100)
        : 0

    const infoItems = [
        { icon: Hash, label: 'Firma No', value: org.company_number },
        { icon: FileText, label: 'Sicil No', value: org.registration_number },
        { icon: Mail, label: 'E-posta', value: org.contact_email },
        { icon: Phone, label: 'Telefon', value: org.contact_phone },
        { icon: MapPin, label: 'Adres', value: org.address },
        { icon: Calendar, label: 'Oluşturulma', value: new Date(org.created_at).toLocaleDateString('tr-TR') },
    ]

    const handleOpenQuotaDialog = () => {
        setNewQuota(org.qr_quota)
        setQuotaDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/organizations')}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Geri
                </Button>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{org.name}</h1>
                        {org.description && <p className="text-sm text-muted-foreground">{org.description}</p>}
                    </div>
                    <StatusBadge status={org.is_active} className="ml-2" />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Departmanlar</CardTitle>
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{org.department_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Kullanıcılar</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{org.user_count}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">QR Kotası</CardTitle>
                        <div className="flex items-center gap-1">
                            {isSuperAdmin && (
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleOpenQuotaDialog}>
                                    <Pencil className="h-3 w-3" />
                                </Button>
                            )}
                            <QrCode className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {quotaData ? (
                            quotaData.is_unlimited ? (
                                <div className="text-2xl font-bold">{quotaData.entity_count} <span className="text-sm font-normal text-muted-foreground">/ Sınırsız</span></div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-2xl font-bold">
                                        {quotaData.entity_count} <span className="text-sm font-normal text-muted-foreground">/ {quotaData.qr_quota}</span>
                                    </div>
                                    <Progress value={quotaPercent} className="h-2" />
                                    <p className="text-xs text-muted-foreground">
                                        Kalan: {quotaData.remaining}
                                    </p>
                                </div>
                            )
                        ) : (
                            <Skeleton className="h-8 w-20" />
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">İletişim Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {infoItems.filter((item) => item.value).map((item) => {
                            const Icon = item.icon
                            return (
                                <div key={item.label} className="flex items-center gap-2 text-sm">
                                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">{item.value}</span>
                                </div>
                            )
                        })}
                        {infoItems.every((item) => !item.value) && (
                            <p className="text-sm text-muted-foreground">Bilgi eklenmemiş</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DepartmentSection organizationId={orgId} />

            {org.is_sandbox && isSuperAdmin && (
                <Card className="border-destructive/30 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            Sandbox Ortamı
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Bu bir test organizasyonudur. Tüm verileri sıfırlayıp demo verileriyle yeniden oluşturabilirsiniz.
                            Bu işlem geri alınamaz.
                        </p>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setResetDialogOpen(true)}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Sandbox Sıfırla
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Dialog open={resetDialogOpen} onOpenChange={(open) => {
                setResetDialogOpen(open)
                if (!open) {
                    setResetPassword('')
                    setResetConfirmText('')
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Sandbox Sıfırlama
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
                            <p className="font-medium text-destructive">Bu işlem geri alınamaz!</p>
                            <ul className="mt-2 list-disc pl-4 text-muted-foreground space-y-1">
                                <li>Tüm kullanıcılar, varlıklar, prosedürler silinecek</li>
                                <li>Tüm uygunsuzluklar ve raporlar silinecek</li>
                                <li>S3 dosyaları (fotoğraflar, belgeler) temizlenecek</li>
                                <li>Demo veriler yeniden oluşturulacak</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reset-password">Demo kullanıcı şifresi</Label>
                            <Input
                                id="reset-password"
                                type="password"
                                placeholder="Yeni demo şifresi girin"
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reset-confirm">
                                Onaylamak için <span className="font-mono font-bold text-destructive">SIFIRLA</span> yazın
                            </Label>
                            <Input
                                id="reset-confirm"
                                placeholder="SIFIRLA"
                                value={resetConfirmText}
                                onChange={(e) => setResetConfirmText(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                                Vazgeç
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={
                                    resetConfirmText !== 'SIFIRLA' ||
                                    !resetPassword ||
                                    resetMutation.isPending
                                }
                                onClick={() => resetMutation.mutate({ id: orgId, password: resetPassword })}
                            >
                                {resetMutation.isPending ? 'Sıfırlanıyor...' : 'Sıfırla'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Kotayı Güncelle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-quota">Yeni QR Kotası</Label>
                            <Input
                                id="new-quota"
                                type="number"
                                min={0}
                                value={newQuota}
                                onChange={(e) => setNewQuota(e.target.valueAsNumber || 0)}
                            />
                            <p className="text-xs text-muted-foreground">0 = Sınırsız</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setQuotaDialogOpen(false)}>İptal</Button>
                            <Button
                                disabled={updateQuotaMutation.isPending}
                                onClick={() => updateQuotaMutation.mutate({ id: orgId, qr_quota: newQuota })}
                            >
                                {updateQuotaMutation.isPending ? 'Kaydediliyor...' : 'Güncelle'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
