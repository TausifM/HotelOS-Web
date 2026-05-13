import { useAuthStore } from "@/store/auth.store";

export function usePermission(permission: string): boolean {
  const { staff } = useAuthStore();
  if (!staff) return false;
  if (staff.permissions.includes('*')) return true;
  const [resource] = permission.split('.');
  return (
    staff.permissions.includes(permission) ||
    staff.permissions.includes(`${resource}.*`)
  );
}