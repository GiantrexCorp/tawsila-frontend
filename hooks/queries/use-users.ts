"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, CACHE_TIMES, STALE_TIMES } from "@/components/providers/query-provider";
import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  assignUserRole,
  User,
  UsersResponse,
  UserFilters,
} from "@/lib/services/users";

/**
 * Hook to fetch users with pagination and filters
 * Users are semi-static - cached for 5 minutes
 */
export function useUsers(
  page: number = 1,
  perPage: number = 50,
  filters: UserFilters = {}
) {
  return useQuery<UsersResponse, Error>({
    queryKey: queryKeys.users.list({ page, perPage, ...filters }),
    queryFn: () => fetchUsers(page, perPage, filters),
    staleTime: STALE_TIMES.SEMI_STATIC,
    gcTime: CACHE_TIMES.SEMI_STATIC,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(id: number) {
  return useQuery<User, Error>({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => fetchUser(id),
    staleTime: STALE_TIMES.SEMI_STATIC,
    gcTime: CACHE_TIMES.SEMI_STATIC,
    enabled: !!id && !isNaN(id),
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalidate all user list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, data),
    onSuccess: (updatedUser, variables) => {
      // Update the specific user in cache
      queryClient.setQueryData(queryKeys.users.detail(variables.id), updatedUser);
      // Invalidate user lists to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, deletedId) => {
      // Remove the user from cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(deletedId) });
      // Invalidate user lists
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Hook to change user password
 */
export function useChangeUserPassword() {
  return useMutation({
    mutationFn: ({
      id,
      password,
      confirmPassword,
    }: {
      id: number;
      password: string;
      confirmPassword: string;
    }) => changeUserPassword(id, password, confirmPassword),
  });
}

/**
 * Hook to assign role to user
 */
export function useAssignUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      assignUserRole(userId, roleId),
    onSuccess: (_, variables) => {
      // Invalidate the specific user and lists
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Hook to prefetch a user (for hover/preload scenarios)
 */
export function usePrefetchUser() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.detail(id),
      queryFn: () => fetchUser(id),
      staleTime: STALE_TIMES.SEMI_STATIC,
    });
  };
}
