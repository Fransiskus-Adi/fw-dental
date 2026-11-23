"use client";

import { createContext, useContext } from "react";
import type { AdminSession } from "./admin-access";

export const AdminAccessContext = createContext<AdminSession | null>(null);

export function useAdminAccess() {
  const user = useContext(AdminAccessContext);
  return {
    user,
    can: (permission: string) => user?.permissions?.[permission] === true,
    canAdminister: (permission: string) =>
      user?.role === "ADMIN" && user.permissions?.[permission] === true,
  };
}
