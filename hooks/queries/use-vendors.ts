"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, CACHE_TIMES, STALE_TIMES } from "@/components/providers/query-provider";
import {
  fetchVendors,
  fetchVendor,
  fetchCurrentVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  fetchGovernorates,
  fetchCities,
  Vendor,
  Governorate,
  City,
  CreateVendorRequest,
} from "@/lib/services/vendors";

/**
 * Hook to fetch all vendors
 * Vendors are semi-static - cached for 5 minutes
 */
export function useVendors() {
  return useQuery<Vendor[], Error>({
    queryKey: queryKeys.vendors.lists(),
    queryFn: fetchVendors,
    staleTime: STALE_TIMES.SEMI_STATIC,
    gcTime: CACHE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook to fetch a single vendor by ID
 */
export function useVendor(id: number) {
  return useQuery<Vendor, Error>({
    queryKey: queryKeys.vendors.detail(id),
    queryFn: () => fetchVendor(id),
    staleTime: STALE_TIMES.SEMI_STATIC,
    gcTime: CACHE_TIMES.SEMI_STATIC,
    enabled: !!id && !isNaN(id),
  });
}

/**
 * Hook to fetch current vendor (for vendor users)
 */
export function useCurrentVendor() {
  return useQuery<Vendor, Error>({
    queryKey: queryKeys.vendors.current(),
    queryFn: fetchCurrentVendor,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: CACHE_TIMES.DYNAMIC,
    retry: 1, // Only retry once for /my-vendor endpoint
  });
}

/**
 * Hook to create a new vendor
 */
export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      // Invalidate vendors list
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.lists() });
    },
  });
}

/**
 * Hook to update a vendor
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateVendorRequest> }) =>
      updateVendor(id, data),
    onSuccess: (updatedVendor, variables) => {
      // Update the specific vendor in cache
      queryClient.setQueryData(queryKeys.vendors.detail(variables.id), updatedVendor);
      // Invalidate vendor lists
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.lists() });
      // Invalidate current vendor if it's the same
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.current() });
    },
  });
}

/**
 * Hook to delete a vendor
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVendor,
    onSuccess: (_, deletedId) => {
      // Remove vendor from cache
      queryClient.removeQueries({ queryKey: queryKeys.vendors.detail(deletedId) });
      // Invalidate vendor lists
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.lists() });
    },
  });
}

/**
 * Hook to fetch governorates
 * Governorates are static data - cached for 30 minutes
 */
export function useGovernorates() {
  return useQuery<Governorate[], Error>({
    queryKey: queryKeys.locations.governorates(),
    queryFn: fetchGovernorates,
    staleTime: STALE_TIMES.STATIC,
    gcTime: CACHE_TIMES.STATIC,
  });
}

/**
 * Hook to fetch cities by governorate
 * Cities are static data - cached for 30 minutes
 */
export function useCities(governorateId?: number) {
  return useQuery<City[], Error>({
    queryKey: queryKeys.locations.cities(governorateId),
    queryFn: () => fetchCities(governorateId!),
    staleTime: STALE_TIMES.STATIC,
    gcTime: CACHE_TIMES.STATIC,
    enabled: !!governorateId,
  });
}

/**
 * Hook to prefetch a vendor (for hover/preload scenarios)
 */
export function usePrefetchVendor() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.vendors.detail(id),
      queryFn: () => fetchVendor(id),
      staleTime: STALE_TIMES.SEMI_STATIC,
    });
  };
}
