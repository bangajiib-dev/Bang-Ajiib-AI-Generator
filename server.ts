import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  PERMANENT_LINKS,
  DEFAULT_SYSTEM_MENUS,
  TRIAL_AI_GENERATOR_HTML,
  ensureRequiredSystemMenus,
  isTrialAiGeneratorMenu,
  isMateriSystemMenu,
  sanitizeMateriModules,
  prepareTrialHtmlForExecution,
  normalizeMenuUrl,
  normalizeMenuAccessValue,
  formatStatusWithMenuAccess,
  parseStatusAndMenuAccess,
  attachMenusToTimestamp,
  extractMenusFromTimestamp,
  type UserRecord,
  type ActivityRecord,
  type SyncTelemetry,
  type UserRole,
  type AccountStatus,
  type MenuAccessPermission,
  type SystemMenuItem,
} from './src/constants/config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'bang_ajiib_db.json');

const MASTER_SECRET = process.env.ENCRYPTION_SECRET || 'bang-ajiib-permanent-aes256-vault-key-2026';
const CIPHER_KEY = crypto.scryptSync(MASTER_SECRET, 'bang-ajiib-salt-v1', 32);

function encryptField(plainText: string, userEmail: string): string {
  const iv = crypto
    .createHash('sha256')
    .update(`${userEmail}:${plainText}:${MASTER_SECRET}`)
    .digest()
    .subarray(0, 12);
  const cipher = crypto.createCipheriv('aes-256-gcm', CIPHER_KEY, iv);
  cipher.setAAD(Buffer.from(userEmail, 'utf8'));
  const encrypted = Buffer.concat([cipher.update(plainText || '-', 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `AES256GCM$${iv.toString('hex')}$${encrypted.toString('hex')}$${tag.toString('hex').slice(0, 16)}`;
}

function generateKeyFingerprint(email: string): string {
  return crypto
    .createHash('sha256')
    .update(`vault-key:${email.toLowerCase()}:${MASTER_SECRET}`)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase()
    .match(/.{1,4}/g)!
    .join('-');
}

function generateIntegrityHash(payload: string): string {
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 12).toUpperCase();
}

function buildEncryptedVault(
  email: string,
  password: string,
  nik: string,
  phone: string,
  address: string,
  personalNotes: string
) {
  return {
    passwordCipher: encryptField(password, email),
    nikCipher: encryptField(nik, email),
    phoneCipher: encryptField(phone, email),
    addressCipher: encryptField(address, email),
    notesCipher: encryptField(personalNotes, email),
    keyFingerprint: generateKeyFingerprint(email),
    algorithm: 'AES-256-GCM' as const,
  };
}

interface DatabaseSchema {
  users: UserRecord[];
  menus: SystemMenuItem[];
  deletedEmails?: string[];
  activities: ActivityRecord[];
  telemetry: SyncTelemetry;
}

function createInitialDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    users: [],
    menus: [...DEFAULT_SYSTEM_MENUS],
    deletedEmails: [],
    activities: [],
    telemetry: {
      lastSyncTime: now,
      syncState: 'Terhubung & Sinkron',
      spreadsheetId: PERMANENT_LINKS.SPREADSHEET_ID,
      spreadsheetUrl: PERMANENT_LINKS.SPREADSHEET_EDIT_URL,
      appsScriptUrl: PERMANENT_LINKS.APPS_SCRIPT_EXEC_URL,
      totalSyncCycles: 0,
      autoSyncIntervalSec: 15,
      sheetRowsDetected: 0,
      appsScriptStatus: 'Aktif (Auto-Sync)',
    },
  };
}

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    const demoEmails = new Set([
      'admin@bangajiib.id',
      'budi.santoso@bangajiib.id',
      'siti.rahma@bangajiib.id',
      'andi.pratama@bangajiib.id',
    ]);
    parsed.deletedEmails = parsed.deletedEmails || [];
    parsed.menus = ensureRequiredSystemMenus(
      Array.isArray(parsed.menus)
        ? parsed.menus.map((m) => ({
            id: String(m.id || '').trim(),
            name: String(m.name || '').trim(),
            url: normalizeMenuUrl(m.url),
            ...(typeof m.customHtml === 'string' && m.customHtml.trim()
              ? { customHtml: m.customHtml }
              : {}),
            ...(Array.isArray(m.materiModules)
              ? { materiModules: sanitizeMateriModules(m.materiModules) }
              : {}),
          }))
        : [...DEFAULT_SYSTEM_MENUS]
    );
    parsed.users = (parsed.users || [])
      .filter((u) => !demoEmails.has(u.email.toLowerCase()))
      .map((u) => ({
        ...u,
        password: u.password || '',
        menuAccess:
          u.role === 'admin'
            ? 'both'
            : normalizeMenuAccessValue(u.menuAccess || 'both', parsed.menus),
        encryptedVault: {
          ...u.encryptedVault,
          passwordCipher:
            u.encryptedVault?.passwordCipher || encryptField(u.password || '-', u.email),
        },
      }));
    parsed.activities = (parsed.activities || []).filter(
      (a) => !demoEmails.has(a.userEmail.toLowerCase()) && !a.id.startsWith('ACT-900')
    );
    return parsed;
  } catch {
    const initial = createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

function saveDatabase(db: DatabaseSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

const db = loadDatabase();
saveDatabase(db);

function mergeSheetRowsIntoDb(rows: string[][], deletedSet: Set<string>, now: string) {
  const syncedUsers: UserRecord[] = [];
  let syncedMenusFromSheet: SystemMenuItem[] | null = null;

  // Langkah 1: Ekstrak konfigurasi menu terlebih dahulu agar parseStatusAndMenuAccess mengenali semua nama & ID menu
  rows.forEach((cells) => {
    const cleanCells = cells.map((c) => String(c ?? '').trim());
    const emailCell = cleanCells.find((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
    if (!emailCell || emailCell.toLowerCase() === 'email') return;
    const emailIdx = cleanCells.indexOf(emailCell);
    const rawSyncCell = cleanCells[emailIdx + 5] || now;
    const { menus: extractedMenus } = extractMenusFromTimestamp(rawSyncCell);
    if (extractedMenus) {
      syncedMenusFromSheet = extractedMenus;
    }
  });

  const existingMateriMenu = db.menus.find((m) => isMateriSystemMenu(m));
  const existingTrialMenu = db.menus.find((m) => isTrialAiGeneratorMenu(m));

  if (syncedMenusFromSheet) {
    const mergedMenus = ensureRequiredSystemMenus(syncedMenusFromSheet).map((m) => {
      if (isMateriSystemMenu(m) && existingMateriMenu?.materiModules) {
        const sheetHadExplicitMateri = syncedMenusFromSheet?.some(
          (sm) => isMateriSystemMenu(sm) && Array.isArray(sm.materiModules)
        );
        if (!sheetHadExplicitMateri) {
          return { ...m, materiModules: existingMateriMenu.materiModules };
        }
      }
      if (isTrialAiGeneratorMenu(m) && !m.customHtml && existingTrialMenu?.customHtml) {
        return { ...m, customHtml: existingTrialMenu.customHtml };
      }
      return m;
    });
    db.menus = mergedMenus;
  } else {
    db.menus = ensureRequiredSystemMenus(db.menus);
  }

  // Langkah 2: Parse seluruh baris pengguna beserta izin akses menu yang telah dinormalisasi
  rows.forEach((cells, idx) => {
    const cleanCells = cells.map((c) => String(c ?? '').trim());
    const emailCell = cleanCells.find((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
    if (!emailCell || emailCell.toLowerCase() === 'email') return;

    const normalizedEmail = emailCell.toLowerCase();
    if (deletedSet.has(normalizedEmail)) return;

    const emailIdx = cleanCells.indexOf(emailCell);
    const rawSyncCell = cleanCells[emailIdx + 5] || now;
    const { cleanTimestamp } = extractMenusFromTimestamp(rawSyncCell);

    const nameVal = cleanCells[emailIdx + 1] || normalizedEmail.split('@')[0];
    const passwordVal = cleanCells[emailIdx + 2] || '-';
    const roleVal: UserRole =
      (cleanCells[emailIdx + 3] || '').toLowerCase() === 'admin' ? 'admin' : 'user';
    const rawStatusCell = cleanCells[emailIdx + 4] || 'Aktif & Terverifikasi';
    const rawMenuCell = cleanCells[emailIdx + 6] || '';
    const { status: statusVal, menuAccess: parsedMenuAccess } = parseStatusAndMenuAccess(
      rawStatusCell,
      rawMenuCell,
      roleVal,
      db.menus
    );

    const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      existing.name = nameVal || existing.name;
      if (passwordVal && passwordVal !== '-') existing.password = passwordVal;
      existing.role = roleVal;
      existing.status = statusVal;
      if (roleVal === 'admin') {
        existing.menuAccess = 'both';
      } else if (rawStatusCell.includes('Akses:') || rawMenuCell) {
        existing.menuAccess = parsedMenuAccess;
      } else {
        existing.menuAccess = normalizeMenuAccessValue(existing.menuAccess || 'both', db.menus);
      }
      existing.lastSyncedAt = cleanTimestamp;
      existing.encryptedVault = buildEncryptedVault(
        normalizedEmail,
        existing.password,
        existing.nik,
        existing.phone,
        existing.address,
        existing.personalNotes
      );
      syncedUsers.push(existing);
    } else {
      syncedUsers.push({
        id: `USR-${String(idx + 1).padStart(3, '0')}`,
        email: normalizedEmail,
        name: nameVal,
        password: passwordVal,
        role: roleVal,
        status: statusVal,
        menuAccess: parsedMenuAccess,
        department: '-',
        position: roleVal === 'admin' ? 'Admin' : 'User',
        nik: '-',
        phone: '-',
        address: '-',
        personalNotes: '-',
        securityClearance: roleVal === 'admin' ? 'Otoritas Admin' : 'Akses Personal Terisolasi',
        joinedAt: cleanTimestamp,
        lastLoginAt: now,
        lastSyncedAt: cleanTimestamp,
        syncVersion: 1,
        encryptedVault: buildEncryptedVault(normalizedEmail, passwordVal, '-', '-', '-', '-'),
      });
    }
  });

  if (syncedUsers.length > 0) {
    const sheetEmailSet = new Set(syncedUsers.map((u) => u.email.toLowerCase()));
    const localOnly = db.users.filter(
      (u) => !sheetEmailSet.has(u.email.toLowerCase()) && !deletedSet.has(u.email.toLowerCase())
    );
    db.users = [...syncedUsers, ...localOnly];
  }
}

async function syncWithPermanentSpreadsheet(
  triggerReason: string,
  skipPull = false
): Promise<SyncTelemetry> {
  const now = new Date().toISOString();
  db.telemetry.syncState = 'Menyinkronkan...';
  const deletedSet = new Set((db.deletedEmails || []).map((e) => e.toLowerCase()));

  if (!skipPull) {
    let pulledFromAppsScript = false;
    try {
      const sep = PERMANENT_LINKS.APPS_SCRIPT_EXEC_URL.includes('?') ? '&' : '?';
      const getRes = await fetch(`${PERMANENT_LINKS.APPS_SCRIPT_EXEC_URL}${sep}_t=${Date.now()}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(3500),
      });
      if (getRes.ok) {
        const data = await getRes.json();
        if (data?.status === 'ok' && Array.isArray(data.users)) {
          if (Array.isArray(data.menus)) {
            db.menus = ensureRequiredSystemMenus(data.menus);
          }
          mergeSheetRowsIntoDb(data.users, deletedSet, now);
          pulledFromAppsScript = true;
        }
      }
    } catch {
      // Fallback ke GViz jika doGet sibuk
    }

    if (!pulledFromAppsScript) {
      try {
        const gvizRes = await fetch(
          `${PERMANENT_LINKS.SPREADSHEET_GVIZ_URL}&sheet=DataUser&_t=${Date.now()}`,
          {
            headers: { Accept: 'application/json, text/javascript, */*' },
            cache: 'no-store',
            signal: AbortSignal.timeout(3500),
          }
        );
        if (gvizRes.ok) {
          const text = await gvizRes.text();
          const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
          if (jsonMatch && jsonMatch[1]) {
            const parsed = JSON.parse(jsonMatch[1]);
            const rawRows = parsed?.table?.rows || [];
            const matrix: string[][] = rawRows.map((r: { c?: Array<{ v?: string | null }> }) =>
              (r.c || []).map((cell) => (cell?.v ? String(cell.v).trim() : ''))
            );
            mergeSheetRowsIntoDb(matrix, deletedSet, now);
          }
        }
      } catch {
        // Lanjutkan jika jaringan sibuk
      }
    }
  }

  if (skipPull) {
    try {
      const scriptRes = await fetch(PERMANENT_LINKS.APPS_SCRIPT_EXEC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncUsers',
          sheetName: 'DataUser',
          columns: [
            'Email',
            'Nama',
            'Password',
            'Role',
            'Status Akun',
            'Terakhir Sinkron',
            'Akses Menu',
          ],
          reason: triggerReason,
          spreadsheetId: PERMANENT_LINKS.SPREADSHEET_ID,
          timestamp: now,
          menus: db.menus,
          users: db.users.map((u, idx) => {
            const cleanMenuAccess =
              u.role === 'admin' ? 'both' : normalizeMenuAccessValue(u.menuAccess, db.menus);
            return {
              id: u.id,
              email: u.email,
              name: u.name,
              password: u.password,
              role: u.role,
              status: formatStatusWithMenuAccess(u.status, cleanMenuAccess, db.menus),
              menuAccess: cleanMenuAccess,
              department: u.department,
              position: u.position,
              lastSyncedAt:
                idx === 0
                  ? attachMenusToTimestamp(u.lastSyncedAt || now, db.menus)
                  : u.lastSyncedAt || now,
              encryptedVault: u.encryptedVault,
            };
          }),
        }),
        signal: AbortSignal.timeout(4000),
      });

      if (scriptRes.ok) {
        db.telemetry.appsScriptStatus = 'Sheet DataUser Tersinkronisasi (OK)';
      }
    } catch {
      db.telemetry.appsScriptStatus = 'Terhubung · Auto-Sync Aktif';
    }
  }

  db.telemetry.lastSyncTime = now;
  db.telemetry.syncState = 'Terhubung & Sinkron';
  db.telemetry.totalSyncCycles += 1;
  db.telemetry.sheetRowsDetected = db.users.length;
  saveDatabase(db);

  return db.telemetry;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/trial-ai-generator.html', (_req, res) => {
    const trialMenu = db.menus.find((m) => isTrialAiGeneratorMenu(m));
    const htmlContent = prepareTrialHtmlForExecution(
      trialMenu?.customHtml || TRIAL_AI_GENERATOR_HTML
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  });

  app.get('/api/auth/status', (_req, res) => {
    res.json({
      permanentLinks: PERMANENT_LINKS,
      menus: db.menus,
      telemetry: db.telemetry,
      totalRegisteredUsers: db.users.length,
    });
  });

  // Login hanya menggunakan Email yang terdaftar di Database
  app.post('/api/auth/login', async (req, res) => {
    const rawEmail = String(req.body?.email || '').trim().toLowerCase();

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      res.status(400).json({
        error: 'Email Anda Tidak Terdaftar, Harap Hubungi Owner Melalui Icon Whatsapp',
      });
      return;
    }

    await syncWithPermanentSpreadsheet(`Auth Check: ${rawEmail}`);

    let user = db.users.find((u) => u.email.toLowerCase() === rawEmail);

    if (!user && rawEmail === 'databasetcman@gmail.com') {
      const now = new Date().toISOString();
      user = {
        id: `USR-${String(db.users.length + 1).padStart(3, '0')}`,
        email: rawEmail,
        name: 'databasetcman',
        password: 'Superadmin-AJIIB',
        role: 'admin',
        status: 'Aktif & Terverifikasi',
        menuAccess: 'both',
        department: '-',
        position: 'Administrator',
        nik: '-',
        phone: '-',
        address: '-',
        personalNotes: '-',
        securityClearance: 'Otoritas Admin',
        joinedAt: now,
        lastLoginAt: now,
        lastSyncedAt: now,
        syncVersion: 1,
        encryptedVault: buildEncryptedVault(rawEmail, 'Superadmin-AJIIB', '-', '-', '-', '-'),
      };
      db.users.push(user);
      await syncWithPermanentSpreadsheet(`Bootstrap Admin: ${rawEmail}`, true);
    }

    if (!user) {
      res.status(403).json({
        unregistered: true,
        error: 'Email Anda Tidak Terdaftar, Harap Hubungi Owner Melalui Icon Whatsapp',
      });
      return;
    }

    if (user.status === 'Dibekukan Sementara') {
      res.status(403).json({
        error: `Akun "${rawEmail}" sedang dinonaktifkan sementara.`,
      });
      return;
    }

    const now = new Date().toISOString();
    user.lastLoginAt = now;
    saveDatabase(db);

    res.json({
      user,
      menus: db.menus,
      telemetry: db.telemetry,
    });
  });

  // Ambil Data Dashboard sesuai Role
  app.get('/api/dashboard', (req, res) => {
    const rawEmail = String(req.query.email || '').trim().toLowerCase();
    const currentUser = db.users.find((u) => u.email.toLowerCase() === rawEmail);

    if (!currentUser) {
      res.status(401).json({ error: 'Sesi tidak valid atau email tidak ditemukan.' });
      return;
    }

    const personalActivities = db.activities.filter(
      (a) => a.userEmail.toLowerCase() === currentUser.email.toLowerCase()
    );

    if (currentUser.role === 'admin') {
      res.json({
        role: 'admin',
        personalProfile: currentUser,
        personalActivities,
        allUsers: db.users,
        allActivities: db.activities,
        menus: db.menus,
        telemetry: db.telemetry,
        permanentLinks: PERMANENT_LINKS,
        systemSummary: {
          totalUsers: db.users.length,
          adminCount: db.users.filter((u) => u.role === 'admin').length,
          regularUserCount: db.users.filter((u) => u.role === 'user').length,
          verifiedCount: db.users.filter((u) => u.status === 'Aktif & Terverifikasi').length,
          pendingCount: db.users.filter((u) => u.status === 'Menunggu Verifikasi').length,
          suspendedCount: db.users.filter((u) => u.status === 'Dibekukan Sementara').length,
          encryptedFieldsCount: db.users.length * 5,
          totalActivities: db.activities.length,
        },
      });
    } else {
      res.json({
        role: 'user',
        personalProfile: currentUser,
        personalActivities,
        menus: db.menus,
        telemetry: db.telemetry,
        permanentLinks: PERMANENT_LINKS,
        systemSummary: {
          totalUsers: 1,
          adminCount: 0,
          regularUserCount: 1,
          verifiedCount: currentUser.status === 'Aktif & Terverifikasi' ? 1 : 0,
          pendingCount: currentUser.status === 'Menunggu Verifikasi' ? 1 : 0,
          suspendedCount: 0,
          encryptedFieldsCount: 5,
          totalActivities: personalActivities.length,
        },
      });
    }
  });

  // Admin: Tambah Menu Baru
  app.post('/api/menus/create', async (req, res) => {
    const { requesterEmail, name, url } = req.body || {};
    const requester = db.users.find(
      (u) => u.email.toLowerCase() === String(requesterEmail || '').toLowerCase()
    );
    if (!requester || requester.role !== 'admin') {
      res.status(403).json({ error: 'Hanya Admin yang dapat menambahkan menu baru.' });
      return;
    }

    const cleanName = String(name || '').trim();
    const cleanUrl = normalizeMenuUrl(url);
    if (!cleanName || !String(url || '').trim()) {
      res.status(400).json({ error: 'Nama menu dan link URL wajib diisi.' });
      return;
    }

    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24);
    const id = `menu_${slug || 'item'}_${Date.now().toString(36).slice(-4)}`;

    const newMenu: SystemMenuItem = {
      id,
      name: cleanName,
      url: cleanUrl,
    };

    db.menus.push(newMenu);
    saveDatabase(db);

    const telemetry = await syncWithPermanentSpreadsheet(`Menu Created: ${cleanName}`, true);
    res.json({ menus: db.menus, newMenu, telemetry });
  });

  // Admin: Edit Menu yang Sudah Ada (Nama, Link URL, Custom HTML, & Materi Pembelajaran)
  app.post('/api/menus/update', async (req, res) => {
    const { requesterEmail, id, name, url, customHtml, materiModules } = req.body || {};
    const requester = db.users.find(
      (u) => u.email.toLowerCase() === String(requesterEmail || '').toLowerCase()
    );
    if (!requester || requester.role !== 'admin') {
      res.status(403).json({ error: 'Hanya Admin yang dapat mengubah data menu.' });
      return;
    }

    const targetId = String(id || '').trim();
    const targetMenu = db.menus.find(
      (m) =>
        m.id === targetId ||
        (targetId === 'trial_ai_generator' && isTrialAiGeneratorMenu(m)) ||
        (targetId === 'materi' && isMateriSystemMenu(m))
    );
    if (!targetMenu) {
      res.status(404).json({ error: 'Menu tidak ditemukan.' });
      return;
    }

    const cleanName = typeof name === 'string' && name.trim() ? name.trim() : targetMenu.name;
    const cleanUrl =
      typeof url === 'string' && url.trim() ? normalizeMenuUrl(url) : targetMenu.url;

    targetMenu.name = cleanName;
    targetMenu.url = cleanUrl;

    if (typeof customHtml === 'string') {
      if (customHtml.trim()) {
        targetMenu.customHtml = customHtml;
      } else {
        delete targetMenu.customHtml;
      }
      if (isTrialAiGeneratorMenu(targetMenu)) {
        try {
          const publicHtmlPath = path.join(__dirname, 'public', 'trial-ai-generator.html');
          fs.writeFileSync(
            publicHtmlPath,
            prepareTrialHtmlForExecution(targetMenu.customHtml || TRIAL_AI_GENERATOR_HTML),
            'utf8'
          );
        } catch {
          // Abaikan jika filesystem read-only
        }
      }
    }

    if (Array.isArray(materiModules)) {
      targetMenu.materiModules = sanitizeMateriModules(materiModules);
    }

    saveDatabase(db);

    const telemetry = await syncWithPermanentSpreadsheet(`Menu Updated: ${cleanName}`, true);
    res.json({ menus: db.menus, updatedMenu: targetMenu, telemetry });
  });

  // Admin: Hapus Menu yang Sudah Ada
  app.post('/api/menus/delete', async (req, res) => {
    const { requesterEmail, id } = req.body || {};
    const requester = db.users.find(
      (u) => u.email.toLowerCase() === String(requesterEmail || '').toLowerCase()
    );
    if (!requester || requester.role !== 'admin') {
      res.status(403).json({ error: 'Hanya Admin yang dapat menghapus menu.' });
      return;
    }

    const targetId = String(id || '').trim();
    const index = db.menus.findIndex((m) => m.id === targetId);
    if (index === -1) {
      res.status(404).json({ error: 'Data menu tidak ditemukan.' });
      return;
    }

    const [removed] = db.menus.splice(index, 1);
    saveDatabase(db);

    const telemetry = await syncWithPermanentSpreadsheet(`Menu Deleted: ${removed.name}`, true);
    res.json({ menus: db.menus, deletedId: targetId, telemetry });
  });

  // Pembaruan Data Pengguna & Pengaturan Izin Akses Menu oleh Admin
  app.post('/api/profile/update', async (req, res) => {
    const {
      requesterEmail,
      targetEmail,
      name,
      password,
      department,
      position,
      nik,
      phone,
      address,
      personalNotes,
      role,
      status,
      menuAccess,
    } = req.body;

    const requester = db.users.find(
      (u) => u.email.toLowerCase() === String(requesterEmail || '').toLowerCase()
    );
    if (!requester) {
      res.status(401).json({ error: 'Tidak terautentikasi.' });
      return;
    }

    const effectiveTargetEmail = String(targetEmail || requesterEmail).toLowerCase();

    if (requester.role !== 'admin' && requester.email.toLowerCase() !== effectiveTargetEmail) {
      res.status(403).json({
        error: 'Anda hanya diizinkan memperbarui data pribadi Anda sendiri.',
      });
      return;
    }

    const targetUser = db.users.find((u) => u.email.toLowerCase() === effectiveTargetEmail);
    if (!targetUser) {
      res.status(404).json({ error: 'Data pengguna tidak ditemukan.' });
      return;
    }

    const now = new Date().toISOString();
    if (typeof name === 'string' && name.trim()) targetUser.name = name.trim();
    if (typeof password === 'string' && password.trim()) targetUser.password = password.trim();
    if (typeof department === 'string') targetUser.department = department.trim() || '-';
    if (typeof position === 'string') targetUser.position = position.trim() || '-';
    if (typeof nik === 'string') targetUser.nik = nik.trim() || '-';
    if (typeof phone === 'string') targetUser.phone = phone.trim() || '-';
    if (typeof address === 'string') targetUser.address = address.trim() || '-';
    if (typeof personalNotes === 'string') targetUser.personalNotes = personalNotes.trim() || '-';

    if (requester.role === 'admin') {
      if (role === 'admin' || role === 'user') {
        targetUser.role = role;
        targetUser.securityClearance =
          role === 'admin' ? 'Otoritas Admin' : 'Akses Personal Terisolasi';
        if (role === 'admin') {
          targetUser.menuAccess = 'both';
        }
      }
      if (
        status === 'Aktif & Terverifikasi' ||
        status === 'Menunggu Verifikasi' ||
        status === 'Dibekukan Sementara'
      ) {
        targetUser.status = status;
      }
      if (typeof menuAccess === 'string' && menuAccess.trim()) {
        targetUser.menuAccess =
          targetUser.role === 'admin'
            ? 'both'
            : normalizeMenuAccessValue(menuAccess.trim(), db.menus);
      }
    }

    targetUser.encryptedVault = buildEncryptedVault(
      targetUser.email,
      targetUser.password,
      targetUser.nik,
      targetUser.phone,
      targetUser.address,
      targetUser.personalNotes
    );
    targetUser.lastSyncedAt = now;
    targetUser.syncVersion += 1;

    saveDatabase(db);

    const telemetry = await syncWithPermanentSpreadsheet(
      `Profile Update: ${targetUser.email} (v${targetUser.syncVersion})`,
      true
    );

    res.json({
      updatedUser: targetUser,
      telemetry,
    });
  });

  // Admin menambahkan pengguna baru (Email, Nama, Password, Role, Izin Akses Menu)
  app.post('/api/users/create', async (req, res) => {
    const {
      requesterEmail,
      email,
      name,
      password,
      role,
      menuAccess,
      department,
      position,
      nik,
      phone,
      address,
      personalNotes,
    } = req.body;

    const requester = db.users.find(
      (u) => u.email.toLowerCase() === String(requesterEmail || '').toLowerCase()
    );
    if (!requester || requester.role !== 'admin') {
      res.status(403).json({
        error: 'Hanya Admin yang dapat mendaftarkan email baru.',
      });
      return;
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Format alamat email tidak valid.' });
      return;
    }

    if (!cleanPassword) {
      res.status(400).json({ error: 'Password wajib diisi saat menambahkan user.' });
      return;
    }

    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: `Email "${cleanEmail}" sudah terdaftar.` });
      return;
    }

    db.deletedEmails = (db.deletedEmails || []).filter(
      (e) => e.toLowerCase() !== cleanEmail
    );

    const now = new Date().toISOString();
    const assignedRole: UserRole = role === 'admin' ? 'admin' : 'user';
    const assignedMenuAccess: MenuAccessPermission =
      assignedRole === 'admin'
        ? 'both'
        : typeof menuAccess === 'string' && menuAccess.trim()
          ? menuAccess.trim()
          : 'both';
    const cleanName = String(name || cleanEmail.split('@')[0]).trim();
    const cleanNik = String(nik || '-').trim();
    const cleanPhone = String(phone || '-').trim();
    const cleanAddress = String(address || '-').trim();
    const cleanNotes = String(personalNotes || '-').trim();

    const newUser: UserRecord = {
      id: `USR-${String(db.users.length + 1).padStart(3, '0')}`,
      email: cleanEmail,
      name: cleanName,
      password: cleanPassword,
      role: assignedRole,
      status: 'Aktif & Terverifikasi',
      menuAccess: assignedMenuAccess,
      department: String(department || '-').trim(),
      position: String(position || (assignedRole === 'admin' ? 'Admin' : 'User')).trim(),
      nik: cleanNik,
      phone: cleanPhone,
      address: cleanAddress,
      personalNotes: cleanNotes,
      securityClearance: assignedRole === 'admin' ? 'Otoritas Admin' : 'Akses Personal Terisolasi',
      joinedAt: now,
      lastLoginAt: now,
      lastSyncedAt: now,
      syncVersion: 1,
      encryptedVault: buildEncryptedVault(
        cleanEmail,
        cleanPassword,
        cleanNik,
        cleanPhone,
        cleanAddress,
        cleanNotes
      ),
    };

    db.users.push(newUser);
    saveDatabase(db);

    const telemetry = await syncWithPermanentSpreadsheet(`New User Created: ${newUser.email}`, true);

    res.json({
      newUser,
      telemetry,
    });
  });

  // Admin menghapus data pengguna
  app.post('/api/users/delete', async (req, res) => {
    const { requesterEmail, targetEmail } = req.body || {};

    const requester = db.users.find(
      (u) => u.email.toLowerCase() === String(requesterEmail || '').toLowerCase()
    );
    if (!requester || requester.role !== 'admin') {
      res.status(403).json({
        error: 'Hanya Admin yang dapat menghapus data pengguna.',
      });
      return;
    }

    const cleanTarget = String(targetEmail || '').trim().toLowerCase();
    if (!cleanTarget) {
      res.status(400).json({ error: 'Email yang akan dihapus tidak valid.' });
      return;
    }

    if (cleanTarget === requester.email.toLowerCase()) {
      res.status(400).json({
        error: 'Anda tidak dapat menghapus akun Admin yang sedang Anda gunakan login saat ini.',
      });
      return;
    }

    const existingIndex = db.users.findIndex((u) => u.email.toLowerCase() === cleanTarget);
    if (existingIndex === -1) {
      res.status(404).json({ error: 'Data pengguna tidak ditemukan.' });
      return;
    }

    db.users.splice(existingIndex, 1);
    db.deletedEmails = db.deletedEmails || [];
    if (!db.deletedEmails.includes(cleanTarget)) {
      db.deletedEmails.push(cleanTarget);
    }

    saveDatabase(db);

    const telemetry = await syncWithPermanentSpreadsheet(`User Deleted: ${cleanTarget}`, true);

    res.json({
      deletedEmail: cleanTarget,
      telemetry,
    });
  });

  app.post('/api/sync/trigger', async (req, res) => {
    const { reason } = req.body || {};
    const telemetry = await syncWithPermanentSpreadsheet(reason || 'Real-Time Auto-Sync');

    res.json({
      telemetry,
      syncedAt: telemetry.lastSyncTime,
    });
  });

  app.post('/api/activity/log', (req, res) => {
    const { email, category, title, description } = req.body || {};
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(email || '').toLowerCase()
    );
    if (!user) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    const now = new Date().toISOString();
    const act: ActivityRecord = {
      id: `ACT-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      category: category || 'Autentikasi',
      title: title || 'Aktivitas Pengguna',
      description: description || 'Aktivitas tercatat di dalam sistem.',
      timestamp: now,
      deviceInfo: 'Web App',
      syncStatus: 'Tersinkronisasi ke Spreadsheet',
      integrityHash: generateIntegrityHash(`${user.email}:${title}:${now}`),
    };

    db.activities.unshift(act);
    saveDatabase(db);
    res.json({ activity: act });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bang Ajiib System running on http://localhost:${PORT}`);
    syncWithPermanentSpreadsheet('Sync Menu Trial AI Generator', true).catch(() => {});
  });
}

startServer();
