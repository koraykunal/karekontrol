'use client'

import { useState } from 'react'

interface UsePaginationStateOptions {
    initialPageSize?: number
}

export function usePagination({ initialPageSize = 20 }: UsePaginationStateOptions = {}) {
    const [page, setPage] = useState(1)
    const [pageSize] = useState(initialPageSize)
    const [search, setSearchValue] = useState('')
    const [ordering, setOrderingValue] = useState('')

    const setOrdering = (value: string) => {
        setOrderingValue(value)
        setPage(1)
    }

    const setSearch = (value: string) => {
        setSearchValue(value)
        setPage(1)
    }

    return {
        page,
        pageSize,
        search,
        ordering,
        setPage,
        setSearch,
        setOrdering,
    }
}
