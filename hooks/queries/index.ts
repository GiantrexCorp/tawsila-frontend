/**
 * React Query hooks for data fetching with caching
 *
 * This module provides cached data fetching hooks using TanStack React Query.
 * All hooks automatically handle:
 * - Caching with configurable TTL
 * - Background refetching on window focus
 * - Automatic cache invalidation on mutations
 * - Optimistic updates where applicable
 * - Loading and error states
 *
 * @example
 * ```tsx
 * import { useUsers, useCreateUser } from '@/hooks/queries';
 *
 * function UsersList() {
 *   const { data, isLoading, error } = useUsers(1, 50, { status: 'active' });
 *   const createUser = useCreateUser();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <div>
 *       {data?.data.map(user => <UserCard key={user.id} user={user} />)}
 *       <button onClick={() => createUser.mutate(newUserData)}>Add User</button>
 *     </div>
 *   );
 * }
 * ```
 */

// Users
export {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useChangeUserPassword,
  useAssignUserRole,
  usePrefetchUser,
} from './use-users';

// Vendors
export {
  useVendors,
  useVendor,
  useCurrentVendor,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
  useGovernorates,
  useCities,
  usePrefetchVendor,
} from './use-vendors';

// Orders
export {
  useOrders,
  useOrder,
  useMyAssignedOrders,
  useOrderAssignments,
  useCreateOrder,
  useAcceptOrder,
  useRejectOrder,
  useAssignPickupAgent,
  usePrefetchOrder,
  useInvalidateOrders,
} from './use-orders';

// Inventory
export {
  useInventories,
  useInventory,
  useCurrentInventory,
  useCreateInventory,
  useUpdateInventory,
  useDeleteInventory,
  usePrefetchInventory,
  useInvalidateInventory,
} from './use-inventory';

// Roles
export {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from './use-roles';
