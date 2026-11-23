export type AdminPermissions = Record<string, boolean>;

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: AdminPermissions;
};

export const adminPagePermissions = {
  "/admin/absence": "page_absence",
  "/admin": "page_dashboard",
  "/admin/bookings": "page_bookings",
  "/admin/transactions": "page_transactions",
  "/admin/schedules": "page_schedules",
  "/admin/master-data/employees": "page_employees",
  "/admin/master-data/doctors": "page_doctors",
  "/admin/master-data/services": "page_services",
  "/admin/master-data/roles": "page_roles",
  "/admin/settings": "page_settings",
} as const;

export function getAdminPagePermission(pathname: string) {
  const path = pathname.replace(/\/$/, "");
  return Object.entries(adminPagePermissions).find(([route]) =>
    path === route || (route !== "/admin" && path.startsWith(route + "/"))
  )?.[1];
}

export function needsClockIn(permissions?: AdminPermissions) {
  return permissions?.page_absence === true && permissions.feat_absence_clock_in === true;
}

export function adminLandingPage(permissions?: AdminPermissions) {
  if (needsClockIn(permissions)) return "/admin/absence";
  const pages = Object.entries(adminPagePermissions);
  return pages.slice(1).find(([, permission]) => permissions?.[permission] === true)?.[0]
    ?? (permissions?.page_absence === true ? "/admin/absence" : "/admin/access-denied");
}
