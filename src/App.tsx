/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut } from 'lucide-react';
import {
  DEFAULT_SYSTEM_MENUS,
  UNREGISTERED_EMAIL_MESSAGE,
  ensureRequiredSystemMenus,
  isTrialAiGeneratorMenu,
  isMateriSystemMenu,
  getSavedTrialHtmlClient,
  setSavedTrialHtmlClient,
  getSavedMateriModulesClient,
  setSavedMateriModulesClient,
  canUserAccessMenu,
  normalizeMenuUrl,
  normalizeMenuAccessValue,
  fetchUsersAndMenusDirectlyFromAppsScript,
  pushUsersDirectlyToAppsScript,
  buildDirectTelemetry,
  setCachedMenusClient,
  type UserRecord,
  type ActivityRecord,
  type SyncTelemetry,
  type UserRole,
  type AccountStatus,
  type MenuAccessPermission,
  type SystemMenuItem,
  type MateriModuleItem,
} from './constants/config.ts';
import { LoginView } from './components/LoginView.tsx';
import { VisualAnalyticsSection } from './components/VisualAnalyticsSection.tsx';
import { PersonalDataSection } from './components/PersonalDataSection.tsx';
import { MenuManagementSection } from './components/MenuManagementSection.tsx';
import { AdminManagementSection } from './components/AdminManagementSection.tsx';
import { TrialAiGeneratorView } from './components/TrialAiGeneratorView.tsx';
import { TrialHtmlEditorModal } from './components/TrialHtmlEditorModal.tsx';
import { MateriDashboardView } from './components/MateriDashboardView.tsx';

interface DashboardPayload {
  role: UserRole;
  personalProfile: UserRecord;
  personalActivities: ActivityRecord[];
  allUsers?: UserRecord[];
  allActivities?: ActivityRecord[];
  menus: SystemMenuItem[];
  telemetry: SyncTelemetry;
  systemSummary: {
    totalUsers: number;
    adminCount: number;
    regularUserCount: number;
    verifiedCount: number;
    pendingCount: number;
    suspendedCount: number;
    encryptedFieldsCount: number;
    totalActivities: number;
  };
}

function buildPayloadFromUsersList(
  email: string,
  users: UserRecord[],
  menus: SystemMenuItem[] = DEFAULT_SYSTEM_MENUS
): DashboardPayload | null {
  const normalizedUsers = users.map((u) => ({
    ...u,
    menuAccess:
      u.role === 'admin' ? 'both' : normalizeMenuAccessValue(u.menuAccess || 'both', menus),
  }));
  const currentUser = normalizedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!currentUser) return null;

  const telemetry = buildDirectTelemetry(normalizedUsers.length);

  if (currentUser.role === 'admin') {
    return {
      role: 'admin',
      personalProfile: currentUser,
      personalActivities: [],
      allUsers: normalizedUsers,
      allActivities: [],
      menus,
      telemetry,
      systemSummary: {
        totalUsers: normalizedUsers.length,
        adminCount: normalizedUsers.filter((u) => u.role === 'admin').length,
        regularUserCount: normalizedUsers.filter((u) => u.role === 'user').length,
        verifiedCount: normalizedUsers.filter((u) => u.status === 'Aktif & Terverifikasi').length,
        pendingCount: normalizedUsers.filter((u) => u.status === 'Menunggu Verifikasi').length,
        suspendedCount: normalizedUsers.filter((u) => u.status === 'Dibekukan Sementara').length,
        encryptedFieldsCount: normalizedUsers.length * 5,
        totalActivities: 0,
      },
    };
  }

  return {
    role: 'user',
    personalProfile: currentUser,
    personalActivities: [],
    menus,
    telemetry,
    systemSummary: {
      totalUsers: 1,
      adminCount: 0,
      regularUserCount: 1,
      verifiedCount: currentUser.status === 'Aktif & Terverifikasi' ? 1 : 0,
      pendingCount: currentUser.status === 'Menunggu Verifikasi' ? 1 : 0,
      suspendedCount: 0,
      encryptedFieldsCount: 5,
      totalActivities: 0,
    },
  };
}

export default function App() {
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(() => {
    return localStorage.getItem('bang_ajiib_session_email');
  });
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [secondsToNextSync, setSecondsToNextSync] = useState(15);
  const [isTrialGeneratorOpen, setIsTrialGeneratorOpen] = useState(false);
  const [isTrialHtmlEditorOpen, setIsTrialHtmlEditorOpen] = useState(false);
  const [isMateriDashboardOpen, setIsMateriDashboardOpen] = useState(false);
  const isMutatingRef = useRef(false);

  const fetchDashboardData = useCallback(async (email: string) => {
    if (isMutatingRef.current) return;
    try {
      const res = await fetch(`/api/dashboard?email=${encodeURIComponent(email)}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        if (!res.ok) {
          localStorage.removeItem('bang_ajiib_session_email');
          setLoggedInEmail(null);
          setDashboardData(null);
          return;
        }
        const data: DashboardPayload = await res.json();
        if (isMutatingRef.current) return;
        const activeMenus = ensureRequiredSystemMenus(
          Array.isArray(data.menus) ? data.menus : DEFAULT_SYSTEM_MENUS
        );
        setCachedMenusClient(activeMenus);
        const normalizedPersonalProfile: UserRecord = {
          ...data.personalProfile,
          menuAccess:
            data.personalProfile.role === 'admin'
              ? 'both'
              : normalizeMenuAccessValue(data.personalProfile.menuAccess || 'both', activeMenus),
        };
        const normalizedAllUsers = Array.isArray(data.allUsers)
          ? data.allUsers.map((u) => ({
              ...u,
              menuAccess:
                u.role === 'admin'
                  ? 'both'
                  : normalizeMenuAccessValue(u.menuAccess || 'both', activeMenus),
            }))
          : undefined;
        setDashboardData({
          ...data,
          personalProfile: normalizedPersonalProfile,
          allUsers: normalizedAllUsers,
          menus: activeMenus,
        });
        return;
      }
    } catch {
      // Fallback langsung ke Google Apps Script jika server sedang tidak merespons JSON
    }

    try {
      const { users, menus } = await fetchUsersAndMenusDirectlyFromAppsScript();
      if (isMutatingRef.current) return;
      const payload = buildPayloadFromUsersList(email, users, menus);
      if (!payload) {
        localStorage.removeItem('bang_ajiib_session_email');
        setLoggedInEmail(null);
        setDashboardData(null);
        return;
      }
      setDashboardData(payload);
    } catch {
      // Pertahankan state saat ini jika jaringan sibuk
    }
  }, []);

  useEffect(() => {
    if (loggedInEmail) {
      fetchDashboardData(loggedInEmail);
    }
  }, [loggedInEmail, fetchDashboardData]);

  // Sinkronisasi Otomatis Berkala setiap 15 detik
  useEffect(() => {
    if (!loggedInEmail) return;

    const timer = setInterval(() => {
      setSecondsToNextSync((prev) => {
        if (prev <= 1) {
          if (!isMutatingRef.current) {
            fetch('/api/sync/trigger', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requesterEmail: loggedInEmail,
                reason: 'Auto-Sync Interval',
                logActivity: false,
              }),
            })
              .then(() => {
                fetchDashboardData(loggedInEmail);
              })
              .catch(() => {
                fetchDashboardData(loggedInEmail);
              });
          }
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loggedInEmail, fetchDashboardData]);

  const handleLoginSuccess = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || UNREGISTERED_EMAIL_MESSAGE);
        }
        localStorage.setItem('bang_ajiib_session_email', cleanEmail);
        setLoggedInEmail(cleanEmail);
        await fetchDashboardData(cleanEmail);
        return;
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        !err.message.includes('Unexpected token') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }
    }

    const { users, menus } = await fetchUsersAndMenusDirectlyFromAppsScript();
    const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!matchedUser) {
      throw new Error(UNREGISTERED_EMAIL_MESSAGE);
    }

    if (matchedUser.status === 'Dibekukan Sementara') {
      throw new Error(`Akun "${cleanEmail}" sedang dinonaktifkan sementara.`);
    }

    localStorage.setItem('bang_ajiib_session_email', cleanEmail);
    setLoggedInEmail(cleanEmail);
    const payload = buildPayloadFromUsersList(cleanEmail, users, menus);
    setDashboardData(payload);
  };

  const handleLogout = async () => {
    if (loggedInEmail) {
      try {
        await fetch('/api/activity/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loggedInEmail,
            category: 'Autentikasi',
            title: 'Logout Sesi Pengguna',
            description: `Pengguna ${loggedInEmail} keluar dari sistem.`,
          }),
        });
      } catch {
        // Lanjutkan logout
      }
    }
    localStorage.removeItem('bang_ajiib_session_email');
    setLoggedInEmail(null);
    setDashboardData(null);
  };

  const handleManualSync = async () => {
    if (!loggedInEmail || isSyncing) return;
    setIsSyncing(true);
    try {
      await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: loggedInEmail,
          reason: 'Manual Sync',
          logActivity: true,
        }),
      }).catch(() => {});
      setSecondsToNextSync(15);
      await fetchDashboardData(loggedInEmail);
    } finally {
      setIsSyncing(false);
    }
  };

  // Admin: Tambah Menu Baru
  const handleCreateMenuByAdmin = async (payload: { name: string; url: string }) => {
    if (!loggedInEmail) return;
    try {
      const res = await fetch('/api/menus/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: loggedInEmail,
          ...payload,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal menambahkan menu baru.');
        }
        setSecondsToNextSync(15);
        await fetchDashboardData(loggedInEmail);
        return;
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        !err.message.includes('Unexpected token') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }
    }

    const { users, menus } = await fetchUsersAndMenusDirectlyFromAppsScript();
    const slug = payload.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24);
    const newMenu: SystemMenuItem = {
      id: `menu_${slug || 'item'}_${Date.now().toString(36).slice(-4)}`,
      name: payload.name.trim(),
      url: normalizeMenuUrl(payload.url),
    };
    const updatedMenus = [...menus, newMenu];
    await pushUsersDirectlyToAppsScript(users, `Create Menu: ${newMenu.name}`, updatedMenus);
    setSecondsToNextSync(15);
    await fetchDashboardData(loggedInEmail);
  };

  // Admin: Edit Menu yang Sudah Ada
  const handleUpdateMenuByAdmin = async (payload: {
    id: string;
    name: string;
    url: string;
  }) => {
    if (!loggedInEmail) return;
    try {
      const res = await fetch('/api/menus/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: loggedInEmail,
          ...payload,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal memperbarui menu.');
        }
        setSecondsToNextSync(15);
        await fetchDashboardData(loggedInEmail);
        return;
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        !err.message.includes('Unexpected token') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }
    }

    const { users, menus } = await fetchUsersAndMenusDirectlyFromAppsScript();
    const updatedMenus = menus.map((m) =>
      m.id === payload.id
        ? {
            ...m,
            name: payload.name.trim(),
            url: normalizeMenuUrl(payload.url),
          }
        : m
    );
    await pushUsersDirectlyToAppsScript(users, `Update Menu: ${payload.name}`, updatedMenus);
    setSecondsToNextSync(15);
    await fetchDashboardData(loggedInEmail);
  };

  // Simpan Perubahan Kode HTML untuk Menu Trial AI Generator
  const handleSaveTrialHtml = async (newHtml: string) => {
    if (!loggedInEmail) return;
    setSavedTrialHtmlClient(newHtml);

    if (dashboardData) {
      const nextMenus = dashboardData.menus.map((m) =>
        isTrialAiGeneratorMenu(m) ? { ...m, customHtml: newHtml } : m
      );
      setCachedMenusClient(nextMenus);
      setDashboardData({
        ...dashboardData,
        menus: nextMenus,
      });
    }

    const currentTrialMenu =
      dashboardData?.menus.find((m) => isTrialAiGeneratorMenu(m)) || {
        id: 'trial_ai_generator',
        name: 'Trial AI Generator',
        url: '/trial-ai-generator.html',
      };

    try {
      const res = await fetch('/api/menus/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: loggedInEmail,
          id: currentTrialMenu.id,
          name: currentTrialMenu.name,
          url: currentTrialMenu.url,
          customHtml: newHtml,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') && res.ok) {
        setSecondsToNextSync(15);
        await fetchDashboardData(loggedInEmail);
        return;
      }
    } catch {
      // Fallback langsung ke Google Apps Script (misalnya saat di-deploy di Vercel)
    }

    try {
      const { users, menus } = await fetchUsersAndMenusDirectlyFromAppsScript();
      const updatedMenus = menus.map((m) =>
        isTrialAiGeneratorMenu(m) ? { ...m, customHtml: newHtml } : m
      );
      setCachedMenusClient(updatedMenus);
      await pushUsersDirectlyToAppsScript(
        users,
        'Update HTML: Trial AI Generator',
        updatedMenus
      );
      setSecondsToNextSync(15);
      await fetchDashboardData(loggedInEmail);
    } catch {
      // Tetap tersimpan di localStorage dan state lokal jika jaringan sibuk
    }
  };

  // Simpan Perubahan Menu Pembelajaran & Video YouTube di dalam Menu "Materi"
  const handleSaveMateriModules = async (
    updatedModules: MateriModuleItem[],
    actionLabel: string
  ) => {
    if (!loggedInEmail) return;
    setSavedMateriModulesClient(updatedModules);

    if (dashboardData) {
      const nextMenus = dashboardData.menus.map((m) =>
        isMateriSystemMenu(m) ? { ...m, materiModules: updatedModules } : m
      );
      setCachedMenusClient(nextMenus);
      setDashboardData({
        ...dashboardData,
        menus: nextMenus,
      });
    }

    const currentMateriMenu =
      dashboardData?.menus.find((m) => isMateriSystemMenu(m)) || {
        id: 'materi',
        name: 'Materi',
        url: '/materi',
      };

    try {
      const res = await fetch('/api/menus/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: loggedInEmail,
          id: currentMateriMenu.id,
          name: currentMateriMenu.name,
          url: currentMateriMenu.url,
          materiModules: updatedModules,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') && res.ok) {
        setSecondsToNextSync(15);
        await fetchDashboardData(loggedInEmail);
        return;
      }
    } catch {
      // Fallback langsung ke Google Apps Script
    }

    try {
      const { users, menus } = await fetchUsersAndMenusDirectlyFromAppsScript();
      const updatedMenus = menus.map((m) =>
        isMateriSystemMenu(m) ? { ...m, materiModules: updatedModules } : m
      );
      setCachedMenusClient(updatedMenus);
      await pushUsersDirectlyToAppsScript(users, actionLabel, updatedMenus);
      setSecondsToNextSync(15);
      await fetchDashboardData(loggedInEmail);
    } catch {
      // Tetap tersimpan di localStorage dan state lokal jika jaringan sibuk
    }
  };

  // Admin: Hapus Menu yang Sudah Ada
  const handleDeleteMenuByAdmin = async (id: string) => {
    if (!loggedInEmail) return;
    try {
      const res = await fetch('/api/menus/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: loggedInEmail,
          id,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal menghapus menu.');
        }
        setSecondsToNextSync(15);
        await fetchDashboardData(loggedInEmail);
        return;
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        !err.message.includes('Unexpected token') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }
    }

    const { users, menus } = await fetchUsersAndMenusDirectlyFromAppsScript();
    const updatedMenus = menus.filter((m) => m.id !== id);
    await pushUsersDirectlyToAppsScript(users, `Delete Menu: ${id}`, updatedMenus);
    setSecondsToNextSync(15);
    await fetchDashboardData(loggedInEmail);
  };

  const handleCreateUserByAdmin = async (newUser: {
    email: string;
    name: string;
    password: string;
    role: UserRole;
    menuAccess: MenuAccessPermission;
    department: string;
    position: string;
    nik: string;
    phone: string;
    address: string;
    personalNotes: string;
  }) => {
    if (!loggedInEmail) return;
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: loggedInEmail,
          ...newUser,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal mendaftarkan pengguna baru.');
        }
        setSecondsToNextSync(15);
        await fetchDashboardData(loggedInEmail);
        return;
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        !err.message.includes('Unexpected token') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }
    }

    const { users: currentUsers, menus } = await fetchUsersAndMenusDirectlyFromAppsScript();
    const cleanEmail = newUser.email.trim().toLowerCase();
    if (currentUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Email "${cleanEmail}" sudah terdaftar.`);
    }
    const now = new Date().toISOString();
    const created: UserRecord = {
      id: `USR-${String(currentUsers.length + 1).padStart(3, '0')}`,
      email: cleanEmail,
      name: newUser.name.trim() || cleanEmail.split('@')[0],
      password: newUser.password.trim(),
      role: newUser.role,
      status: 'Aktif & Terverifikasi',
      menuAccess: newUser.role === 'admin' ? 'both' : newUser.menuAccess,
      department: '-',
      position: newUser.role === 'admin' ? 'Admin' : 'User',
      nik: '-',
      phone: '-',
      address: '-',
      personalNotes: '-',
      securityClearance: newUser.role === 'admin' ? 'Otoritas Admin' : 'Akses Personal Terisolasi',
      joinedAt: now,
      lastLoginAt: now,
      lastSyncedAt: now,
      syncVersion: 1,
      encryptedVault: {
        passwordCipher: '-',
        nikCipher: '-',
        phoneCipher: '-',
        addressCipher: '-',
        notesCipher: '-',
        keyFingerprint: cleanEmail.slice(0, 8).toUpperCase(),
        algorithm: 'AES-256-GCM',
      },
    };
    const updatedList = [...currentUsers, created];
    await pushUsersDirectlyToAppsScript(updatedList, `Create User: ${cleanEmail}`, menus);
    setSecondsToNextSync(15);
    await fetchDashboardData(loggedInEmail);
  };

  const handleUpdateUserByAdmin = async (payload: {
    targetEmail: string;
    role: UserRole;
    status: AccountStatus;
    menuAccess: MenuAccessPermission;
  }) => {
    if (!loggedInEmail) return;
    const activeMenus = dashboardData?.menus || DEFAULT_SYSTEM_MENUS;
    const normalizedAccess =
      payload.role === 'admin'
        ? 'both'
        : normalizeMenuAccessValue(payload.menuAccess, activeMenus);

    isMutatingRef.current = true;
    setSecondsToNextSync(15);

    let optimisticUsersList: UserRecord[] | undefined;

    setDashboardData((prev) => {
      if (!prev) return prev;
      const updatedAllUsers = prev.allUsers?.map((u) =>
        u.email.toLowerCase() === payload.targetEmail.toLowerCase()
          ? {
              ...u,
              role: payload.role,
              status: payload.status,
              menuAccess: normalizedAccess,
            }
          : u
      );
      optimisticUsersList = updatedAllUsers;
      const updatedProfile =
        prev.personalProfile.email.toLowerCase() === payload.targetEmail.toLowerCase()
          ? {
              ...prev.personalProfile,
              role: payload.role,
              status: payload.status,
              menuAccess: normalizedAccess,
            }
          : prev.personalProfile;
      return {
        ...prev,
        personalProfile: updatedProfile,
        allUsers: updatedAllUsers,
      };
    });

    try {
      try {
        const res = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requesterEmail: loggedInEmail,
            targetEmail: payload.targetEmail,
            role: payload.role,
            status: payload.status,
            menuAccess: normalizedAccess,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json') && res.ok) {
          setSecondsToNextSync(15);
          isMutatingRef.current = false;
          await fetchDashboardData(loggedInEmail);
          return;
        }
      } catch {
        // Fallback langsung ke Google Apps Script
      }

      const baseUsers =
        optimisticUsersList ||
        (await fetchUsersAndMenusDirectlyFromAppsScript()).users;
      const updatedList = baseUsers.map((u) =>
        u.email.toLowerCase() === payload.targetEmail.toLowerCase()
          ? {
              ...u,
              role: payload.role,
              status: payload.status,
              menuAccess: normalizedAccess,
            }
          : u
      );
      await pushUsersDirectlyToAppsScript(
        updatedList,
        `Update User: ${payload.targetEmail} (${normalizedAccess})`,
        activeMenus
      );
      setSecondsToNextSync(15);
    } finally {
      isMutatingRef.current = false;
    }
  };

  const handleDeleteUserByAdmin = async (targetEmail: string) => {
    if (!loggedInEmail) return;
    try {
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: loggedInEmail,
          targetEmail,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal menghapus data pengguna.');
        }
        setSecondsToNextSync(15);
        await fetchDashboardData(loggedInEmail);
        return;
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        !err.message.includes('Unexpected token') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }
    }

    const { users: currentUsers, menus } = await fetchUsersAndMenusDirectlyFromAppsScript();
    const updatedList = currentUsers.filter(
      (u) => u.email.toLowerCase() !== targetEmail.toLowerCase()
    );
    await pushUsersDirectlyToAppsScript(updatedList, `Delete User: ${targetEmail}`, menus);
    setSecondsToNextSync(15);
    await fetchDashboardData(loggedInEmail);
  };

  const handleMasukSystemClick = (menu: SystemMenuItem) => {
    if (
      dashboardData &&
      !canUserAccessMenu(dashboardData.personalProfile, menu.id, dashboardData.menus)
    ) {
      return;
    }

    if (isTrialAiGeneratorMenu(menu)) {
      setIsTrialGeneratorOpen(true);
    } else if (isMateriSystemMenu(menu)) {
      setIsMateriDashboardOpen(true);
    }
    if (loggedInEmail) {
      fetch('/api/activity/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loggedInEmail,
          category: 'Autentikasi',
          title: `Akses Menu ${menu.name}`,
          description: `Pengguna mengakses menu ${menu.name} (${menu.url}).`,
        }),
      }).catch(() => {});
    }
  };

  const activeTrialHtml = getSavedTrialHtmlClient(dashboardData?.menus);
  const activeMateriModules = getSavedMateriModulesClient(dashboardData?.menus);
  const activeMateriMenu = dashboardData?.menus.find((m) => isMateriSystemMenu(m));
  const canOpenMateriDashboard = dashboardData
    ? canUserAccessMenu(
        dashboardData.personalProfile,
        activeMateriMenu?.id || 'materi',
        dashboardData.menus
      )
    : false;

  return (
    <>
      <AnimatePresence mode="wait">
        {!loggedInEmail || !dashboardData ? (
          <motion.div
            key="login-screen"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <LoginView onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        ) : isTrialGeneratorOpen ? (
          <motion.div
            key="trial-ai-generator-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TrialAiGeneratorView
              htmlContent={activeTrialHtml}
              isAdmin={dashboardData.role === 'admin'}
              onBack={() => setIsTrialGeneratorOpen(false)}
              onOpenEditHtml={() => setIsTrialHtmlEditorOpen(true)}
            />
          </motion.div>
        ) : isMateriDashboardOpen && canOpenMateriDashboard ? (
          <motion.div
            key="materi-dashboard-screen"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <MateriDashboardView
              modules={activeMateriModules}
              role={dashboardData.role}
              userEmail={dashboardData.personalProfile.email}
              userName={dashboardData.personalProfile.name}
              onBack={() => setIsMateriDashboardOpen(false)}
              onSaveModules={handleSaveMateriModules}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-screen"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen bg-slate-50 text-slate-900 flex flex-col"
          >
            {/* Simple Top Header with Top-Right Logout Button */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
              <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/aistudio/image_280feb17.png"
                    alt="Logo Bang Ajiib System"
                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                  <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                    Bang Ajiib System
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Logout"
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Simplified Single-Column Main Container */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
              {/* Simple Welcome Box */}
              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">
                    Selamat datang,{' '}
                    <span className="font-semibold text-slate-800 uppercase">
                      {dashboardData.role}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {dashboardData.personalProfile.name}
                  </h1>
                </div>
              </section>

              {/* 1. Real-Time Visual Summary & Sync (Hanya ditampilkan untuk Admin) */}
              {dashboardData.role === 'admin' && (
                <VisualAnalyticsSection
                  role={dashboardData.role}
                  personalProfile={dashboardData.personalProfile}
                  summary={dashboardData.systemSummary}
                  activities={
                    dashboardData.allActivities || dashboardData.personalActivities
                  }
                  telemetry={dashboardData.telemetry}
                  secondsToNextSync={secondsToNextSync}
                  isSyncing={isSyncing}
                  onTriggerSync={handleManualSync}
                />
              )}

              {/* 2. Personal Profile Data + Daftar Tombol Menu Aksi Dinamis sesuai Izin Admin */}
              <PersonalDataSection
                profile={dashboardData.personalProfile}
                menus={dashboardData.menus}
                onMasukSystemClick={handleMasukSystemClick}
                onEditTrialHtml={
                  dashboardData.role === 'admin'
                    ? () => setIsTrialHtmlEditorOpen(true)
                    : undefined
                }
              />

              {/* 3. Manajemen Menu & Link Aksi (Khusus Admin: Tambah, Edit, Hapus Menu) */}
              {dashboardData.role === 'admin' && (
                <MenuManagementSection
                  menus={dashboardData.menus}
                  onCreateMenu={handleCreateMenuByAdmin}
                  onUpdateMenu={handleUpdateMenuByAdmin}
                  onDeleteMenu={handleDeleteMenuByAdmin}
                  onOpenMenu={handleMasukSystemClick}
                  onEditTrialHtml={() => setIsTrialHtmlEditorOpen(true)}
                />
              )}

              {/* 4. Manajemen Pengguna & Pengaturan Izin Akses Menu (Khusus Admin) */}
              {dashboardData.role === 'admin' && dashboardData.allUsers && (
                <AdminManagementSection
                  users={dashboardData.allUsers}
                  menus={dashboardData.menus}
                  currentAdminEmail={dashboardData.personalProfile.email}
                  onCreateUser={handleCreateUserByAdmin}
                  onUpdateUserAdmin={handleUpdateUserByAdmin}
                  onDeleteUserAdmin={handleDeleteUserByAdmin}
                />
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <TrialHtmlEditorModal
        isOpen={isTrialHtmlEditorOpen}
        initialHtml={activeTrialHtml}
        onClose={() => setIsTrialHtmlEditorOpen(false)}
        onSaveHtml={handleSaveTrialHtml}
      />
    </>
  );
}
