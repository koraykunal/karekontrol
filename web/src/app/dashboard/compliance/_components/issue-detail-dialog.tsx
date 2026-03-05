'use client'

import { useState } from 'react'
import { AlertTriangle, Calendar, Tag, User, Building2, MessageSquare, Send } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useIssue, useResolveIssue, useIssueComments, useAddIssueComment } from '@/hooks/queries/use-compliance'
import { ISSUE_STATUS_LABELS, type IssueSeverity, type IssueStatus } from '@/lib/constants'
import type { IssueListItem } from '@/types'

const severityMap: Record<IssueSeverity, { label: string; className: string }> = {
    LOW: { label: 'Düşük', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    MEDIUM: { label: 'Orta', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    HIGH: { label: 'Yüksek', className: 'bg-red-100 text-red-800 border-red-200' },
    CRITICAL: { label: 'Kritik', className: 'bg-red-200 text-red-900 border-red-300' },
}

const statusColorMap: Record<IssueStatus, string> = {
    OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
    RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    VERIFIED: 'bg-green-100 text-green-800 border-green-200',
    ESCALATED: 'bg-red-100 text-red-800 border-red-200',
    CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
}

interface IssueDetailDialogProps {
    issue: IssueListItem | null
    open: boolean
    onOpenChange: (open: boolean) => void
    initialResolve?: boolean
}

export function IssueDetailDialog({ issue, open, onOpenChange, initialResolve = false }: IssueDetailDialogProps) {
    const [resolveMode, setResolveMode] = useState(initialResolve)
    const [resolveNotes, setResolveNotes] = useState('')
    const [commentText, setCommentText] = useState('')

    const issueId = issue?.id ?? 0
    const { data: detail, isLoading } = useIssue(issueId, open && !!issue)
    const { data: commentsData } = useIssueComments(issueId, open && !!issue)
    const addCommentMutation = useAddIssueComment(issueId, { onSuccess: () => setCommentText('') })

    const comments = commentsData?.data ?? []

    const resolveMutation = useResolveIssue({
        onSuccess: () => {
            setResolveMode(false)
            setResolveNotes('')
            onOpenChange(false)
        },
    })

    const handleClose = () => {
        setResolveMode(false)
        setResolveNotes('')
        onOpenChange(false)
    }

    const handleResolve = () => {
        if (!issue) return
        resolveMutation.mutate({ id: issue.id, resolved_notes: resolveNotes })
    }

    const canResolve = detail?.status === 'OPEN' || detail?.status === 'IN_PROGRESS'

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Uyumsuzluk Detayı
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-6 w-full" />
                        ))}
                    </div>
                ) : detail ? (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold">{detail.title}</h2>
                            <p className="text-sm text-muted-foreground mt-1">{detail.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={severityMap[detail.severity]?.className ?? ''}>
                                {severityMap[detail.severity]?.label ?? detail.severity}
                            </Badge>
                            <Badge variant="outline" className={statusColorMap[detail.status] ?? ''}>
                                {ISSUE_STATUS_LABELS[detail.status] ?? detail.status}
                            </Badge>
                            {detail.category && (
                                <Badge variant="secondary">{detail.category}</Badge>
                            )}
                        </div>

                        <div className="grid gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="h-4 w-4 shrink-0" />
                                <span>Varlık:</span>
                                <span className="font-medium text-foreground">{detail.entity_name ?? `#${detail.entity}`}</span>
                            </div>
                            {detail.assigned_to_user_name && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4 shrink-0" />
                                    <span>Atanan:</span>
                                    <span className="font-medium text-foreground">{detail.assigned_to_user_name}</span>
                                </div>
                            )}
                            {detail.assigned_to_department_name && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="h-4 w-4 shrink-0" />
                                    <span>Departman:</span>
                                    <span className="font-medium text-foreground">{detail.assigned_to_department_name}</span>
                                </div>
                            )}
                            {detail.due_date && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4 shrink-0" />
                                    <span>Bitiş tarihi:</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(detail.due_date).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                            )}
                            {detail.tags?.length > 0 && (
                                <div className="flex items-start gap-2 text-muted-foreground">
                                    <Tag className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>Etiketler:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {detail.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4 shrink-0" />
                                <span>Oluşturulma:</span>
                                <span className="font-medium text-foreground">
                                    {new Date(detail.created_at).toLocaleString('tr-TR')}
                                </span>
                            </div>
                        </div>

                        {detail.resolved_notes && (
                            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                                <p className="text-sm font-medium text-emerald-800">Çözüm Notu</p>
                                <p className="text-sm text-emerald-700 mt-1">{detail.resolved_notes}</p>
                                {detail.resolved_by_name && (
                                    <p className="text-xs text-emerald-600 mt-1">— {detail.resolved_by_name}</p>
                                )}
                            </div>
                        )}

                        {resolveMode && canResolve && (
                            <div className="space-y-2 rounded-md border p-4">
                                <Label>Çözüm Notu</Label>
                                <Textarea
                                    placeholder="Çözüm hakkında notlar girin..."
                                    value={resolveNotes}
                                    onChange={(e) => setResolveNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <MessageSquare className="h-4 w-4" />
                                Yorumlar {comments.length > 0 && `(${comments.length})`}
                            </div>
                            {comments.length > 0 && (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {comments.map((c) => (
                                        <div key={c.id} className="rounded-md bg-muted/50 p-3 text-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">{c.user_name ?? 'Kullanıcı'}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(c.created_at).toLocaleDateString('tr-TR')}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground">{c.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder="Yorum ekleyin..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    rows={2}
                                    className="text-sm"
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-auto shrink-0"
                                    onClick={() => {
                                        if (commentText.trim()) {
                                            addCommentMutation.mutate({ content: commentText.trim() })
                                        }
                                    }}
                                    disabled={!commentText.trim() || addCommentMutation.isPending}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose}>
                        Kapat
                    </Button>
                    {detail && canResolve && !resolveMode && (
                        <Button variant="default" onClick={() => setResolveMode(true)}>
                            Çözüme Kavuştur
                        </Button>
                    )}
                    {resolveMode && (
                        <Button
                            onClick={handleResolve}
                            disabled={!resolveNotes.trim() || resolveMutation.isPending}
                        >
                            {resolveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
