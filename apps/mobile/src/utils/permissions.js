/**
 * Central permissions utility — single source of truth.
 *
 * MODULE KEY → APP SECTION mapping
 * These keys must match exactly what is stored in roles.permissions in the DB.
 *
 * Tab access:   a tab is accessible if the user has ANY of its modules
 * Section access: individual sections inside a tab check their own module key
 * Special rules:
 *   - "field" tab → always open (every user needs to clock in)
 *   - admin permission → full access to everything
 *   - empty permissions object → super admin, full access
 */

import { useAuthStore } from '../store/authStore';

// ─── Mapping: module key → which tab + section it belongs to ─────────────────
export const MODULE_MAP = {
  admin:       { tab: 'Admin',     label: 'Admin Panel'           },
  brand_hub:   { tab: 'BrandHub',  label: 'Brand Hub'             },
  auditing:    { tab: 'Auditing',  label: 'Auditing'              },
  field:       { tab: 'Field',     label: 'Field Attendance', alwaysOpen: true },
  campaigns:   { tab: 'StoreOps', section: 'campaigns', label: 'Campaigns'           },
  vm:          { tab: 'StoreOps', section: 'vm',        label: 'Visual Merchandising' },
  signage:     { tab: 'StoreOps', section: 'signage',   label: 'Signage'             },
  training:    { tab: 'StoreOps', section: 'training',  label: 'Training'            },
  environment: { tab: 'StoreOps', section: 'environment', label: 'Store Environment' },
  cx:          { tab: 'StoreOps', section: 'cx',        label: 'Customer Experience' },
  analytics:   { tab: 'Analytics', label: 'Analytics'             },
};

// ─── Tab → modules that unlock it ────────────────────────────────────────────
export const TAB_MODULES = {
  Admin:     ['admin'],
  BrandHub:  ['brand_hub'],
  Auditing:  ['auditing'],
  Field:     null,                                              // always open
  StoreOps:  ['campaigns', 'vm', 'signage', 'training', 'environment', 'cx'],
  Analytics: ['analytics'],
};

// ─── Low-level helper ─────────────────────────────────────────────────────────
function moduleAllowed(permissions, moduleKey) {
  const p = permissions[moduleKey];
  if (!p) return false;
  if (p === true) return true;
  if (typeof p === 'object') return Object.values(p).some(Boolean);
  return false;
}

// ─── Core access check ────────────────────────────────────────────────────────
/**
 * Returns true if the given permissions object grants access to moduleKey.
 * - null moduleKey  → always allowed
 * - empty perms     → super admin, always allowed
 * - admin perms     → allowed everywhere
 * - array of keys   → allowed if ANY key passes
 * - single key      → check that module
 */
export function checkAccess(permissions, moduleKey) {
  if (moduleKey === null) return true;
  if (!permissions || Object.keys(permissions).length === 0) return true;
  if (moduleAllowed(permissions, 'admin')) return true;
  if (Array.isArray(moduleKey)) return moduleKey.some(k => moduleAllowed(permissions, k));
  return moduleAllowed(permissions, moduleKey);
}

// ─── React hook ───────────────────────────────────────────────────────────────
/**
 * usePermissions()
 *
 * Returns:
 *   hasAccess(moduleKeyOrArray)  — check a module key or array of module keys
 *   canAccessTab(tabName)        — check if an entire tab is accessible
 *   isAdmin                      — true if user has admin permission or is super admin
 *   permissions                  — raw permissions object from user
 */
export function usePermissions() {
  const { user } = useAuthStore();
  const permissions = user?.permissions || {};

  const isSuperAdmin = Object.keys(permissions).length === 0;
  const isAdmin = isSuperAdmin || moduleAllowed(permissions, 'admin');

  function hasAccess(moduleKey) {
    return checkAccess(permissions, moduleKey);
  }

  function canAccessTab(tabName) {
    const modules = TAB_MODULES[tabName];
    return checkAccess(permissions, modules);
  }

  return { hasAccess, canAccessTab, isAdmin, isSuperAdmin, permissions };
}
