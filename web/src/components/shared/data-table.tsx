'use client'

import {useState, useCallback, useEffect, type ReactNode} from 'react'
import {Input} from '@/components/ui/input'
import {Skeleton} from '@/components/ui/skeleton'
import {Button} from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search} from 'lucide-react'

export interface Column<T> {
    key: string
    label: string
    sortable?: boolean
    className?: string
    render?: (item: T) => ReactNode
}

interface DataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    isLoading?: boolean
    searchPlaceholder?: string
    totalCount?: number
    page?: number
    pageSize?: number
    search?: string
    ordering?: string
    onPageChange?: (page: number) => void
    onSearchChange?: (search: string) => void
    onSortChange?: (ordering: string) => void
    emptyMessage?: string
    toolbar?: ReactNode
}

export function DataTable<T extends { id?: number | string }>({
                                                                  columns,
                                                                  data,
                                                                  isLoading = false,
                                                                  searchPlaceholder = 'Ara...',
                                                                  totalCount = 0,
                                                                  page = 1,
                                                                  pageSize = 20,
                                                                  search = '',
                                                                  ordering = '',
                                                                  onPageChange,
                                                                  onSearchChange,
                                                                  onSortChange,
                                                                  emptyMessage = 'Kayıt bulunamadı',
                                                                  toolbar,
                                                              }: DataTableProps<T>) {
    const [searchInput, setSearchInput] = useState(search)
    const totalPages = Math.ceil(totalCount / pageSize)

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== search) {
                onSearchChange?.(searchInput)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchInput, search, onSearchChange])

    const handleSort = useCallback((key: string) => {
        if (!onSortChange) return
        if (ordering === key) {
            onSortChange(`-${key}`)
        } else if (ordering === `-${key}`) {
            onSortChange('')
        } else {
            onSortChange(key)
        }
    }, [ordering, onSortChange])

    const getSortIcon = (key: string) => {
        if (ordering === key) return <ArrowUp className="ml-1 h-3 w-3"/>
        if (ordering === `-${key}`) return <ArrowDown className="ml-1 h-3 w-3"/>
        return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30"/>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                {onSearchChange && (
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                )}
                {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key} className={col.className}>
                                    {col.sortable ? (
                                        <button
                                            className="flex items-center hover:text-foreground"
                                            onClick={() => handleSort(col.key)}
                                        >
                                            {col.label}
                                            {getSortIcon(col.key)}
                                        </button>
                                    ) : (
                                        col.label
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key}>
                                            <Skeleton className="h-4 w-full"/>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => (
                                <TableRow key={item.id ?? index}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key} className={col.className}>
                                            {col.render
                                                ? col.render(item)
                                                : String((item as Record<string, unknown>)[col.key] ?? '')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Toplam {totalCount} kayıt
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(page - 1)}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4"/>
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(page + 1)}
                            disabled={page >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
