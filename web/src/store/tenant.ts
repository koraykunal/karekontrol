'use client'

import { create } from 'zustand'
import type { Organization } from '@/types'

interface TenantState {
    currentOrganization: Organization | null
    isPlatformOwner: boolean
    availableOrganizations: Organization[]
}

interface TenantActions {
    setOrganization: (org: Organization | null, queryClientClear?: () => void) => void
    setPlatformOwner: (value: boolean) => void
    setAvailableOrganizations: (orgs: Organization[]) => void
    reset: () => void
}

export const useTenantStore = create<TenantState & TenantActions>()((set) => ({
    currentOrganization: null,
    isPlatformOwner: false,
    availableOrganizations: [],

    setOrganization: (org, queryClientClear) => {
        queryClientClear?.()
        set({ currentOrganization: org })
    },

    setPlatformOwner: (value) => set({ isPlatformOwner: value }),

    setAvailableOrganizations: (orgs) => set({ availableOrganizations: orgs }),

    reset: () =>
        set({
            currentOrganization: null,
            isPlatformOwner: false,
            availableOrganizations: [],
        }),
}))
