import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/store/react-query/keys';
import { procedureService } from '@/src/api/services/procedure.service';
import { entityService } from '@/src/api/services/entity.service';
import { userService } from '@/src/api/services/user.service';
import { organizationService } from '@/src/api/services/organization.service';
import type { CreateProcedureData, UpdateProcedureData, CreateStepData, UpdateStepData } from '@/src/api/types/procedure.types';
import type { CreateEntityData, UpdateEntityData } from '@/src/api/types/entity.types';
import { UserRole } from '@/src/api/types/enums';
import { UserFilters, CreateUserData, UpdateUserData } from '@/src/api/endpoints/user.endpoints';

// ============ Entity Admin Mutations ============

export function useCreateEntity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateEntityData) => entityService.createEntity(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.entities.all() });
        },
    });
}

export function useUpdateEntity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateEntityData }) =>
            entityService.updateEntity(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.entities.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.entities.lists() });
        },
    });
}

export function useDeleteEntity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => entityService.deleteEntity(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.entities.all() });
        },
    });
}

export function useUploadEntityImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ entityId, imageUri, isPrimary }: { entityId: number; imageUri: string; isPrimary?: boolean }) =>
            entityService.uploadImage(entityId, imageUri, isPrimary ?? true),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.entities.detail(variables.entityId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.entities.lists() });
        },
    });
}

// ============ Procedure Admin Mutations ============

export function useCreateProcedure() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateProcedureData) => procedureService.createProcedure(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.all() });
        },
    });
}

export function useUpdateProcedure() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateProcedureData }) =>
            procedureService.updateProcedure(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.lists() });
        },
    });
}

export function useDeleteProcedure() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => procedureService.deleteProcedure(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.all() });
        },
    });
}

export function useActivateProcedure() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => procedureService.activateProcedure(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.lists() });
        },
    });
}

export function useDeactivateProcedure() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => procedureService.deactivateProcedure(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.lists() });
        },
    });
}

// ============ Procedure Step Mutations ============

export function useProcedureSteps(procedureId: number) {
    return useQuery({
        queryKey: queryKeys.procedures.steps(procedureId),
        queryFn: () => procedureService.getSteps(procedureId),
        enabled: !!procedureId,
    });
}

export function useCreateStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ procedureId, data }: { procedureId: number; data: CreateStepData }) =>
            procedureService.createStep(procedureId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.steps(variables.procedureId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.detail(variables.procedureId) });
        },
    });
}

export function useUpdateStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ stepId, data, procedureId }: { stepId: number; data: UpdateStepData; procedureId: number }) =>
            procedureService.updateStep(stepId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.steps(variables.procedureId) });
        },
    });
}

export function useDeleteStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ stepId, procedureId }: { stepId: number; procedureId: number }) =>
            procedureService.deleteStep(stepId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.steps(variables.procedureId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.detail(variables.procedureId) });
        },
    });
}

export function useReorderSteps() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ procedureId, stepOrders }: { procedureId: number; stepOrders: { id: number; order: number }[] }) =>
            procedureService.reorderSteps(procedureId, stepOrders),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.procedures.steps(variables.procedureId) });
        },
    });
}

// ============ Department Queries ============

export function useDepartments() {
    return useQuery({
        queryKey: ['departments'],
        queryFn: () => organizationService.getDepartments(),
    });
}

// ============ User Admin Mutations ============

export function useUsers(filters?: UserFilters) {
    return useQuery({
        queryKey: queryKeys.users.list(filters ?? {}),
        queryFn: () => userService.getUsers(filters),
    });
}

export function useUser(id: number) {
    return useQuery({
        queryKey: queryKeys.users.detail(id),
        queryFn: () => userService.getUser(id),
        enabled: !!id,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserData) => userService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) =>
            userService.updateUser(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
        },
    });
}

export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, role }: { id: number; role: UserRole }) =>
            userService.updateRole(id, role),
        onSuccess: (result, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });

            // Update auth store if the updated user is the current user
            const { useAuthStore } = require('@/src/store/zustand/auth.store');
            const authStore = useAuthStore.getState();
            if (authStore.user?.id === variables.id) {
                const updatedUser = (result as any)?.data || result;
                authStore.updateUser({
                    role: updatedUser.role || variables.role,
                    is_admin: updatedUser.is_admin,
                    is_manager: updatedUser.is_manager,
                });
            }
        },
    });
}

export function useActivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => userService.activateUser(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
        },
    });
}

export function useDeactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => userService.deactivateUser(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
        },
    });
}


