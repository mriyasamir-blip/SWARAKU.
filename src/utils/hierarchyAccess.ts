import type { UserAccount, VoterOcrRecord } from '../types/vore';
import { getProvinsiByKota } from '../data/wilayahIndonesia';

// ============================================================================
// SWARAKU — GLOBAL TERRITORIAL HIERARCHY & ACCESS CONTROL UTILITIES
// ============================================================================

export function normalizeRoleKey(role?: string | null): string {
  return String(role || '').trim().toLowerCase().replace(/\s+/g, '_');
}

export function isFullAccessRole(role?: string | null): boolean {
  const r = normalizeRoleKey(role);
  return (
    r === 'zuper_admin' ||
    r === 'zuperadmin' ||
    r === 'super_admin' ||
    r === 'superadmin' ||
    r === 'admin'
  );
}

export function isKorwilRole(role?: string | null): boolean {
  const r = normalizeRoleKey(role);
  return r === 'tim_sukses' || r === 'korwil';
}

export function isKorcamRole(role?: string | null): boolean {
  const r = normalizeRoleKey(role);
  return r === 'kader' || r === 'korcam';
}

export function isRelawanRole(role?: string | null): boolean {
  const r = normalizeRoleKey(role);
  return r === 'relawan';
}

export function canAccessMonitoringRelawan(role?: string | null): boolean {
  return isFullAccessRole(role) || isKorwilRole(role) || isKorcamRole(role);
}

export function shouldAutoTrackGps(role?: string | null): boolean {
  return isKorcamRole(role) || isRelawanRole(role);
}

export function normalizeAreaText(value?: string | null): string {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^(provinsi|prov\.?|kota|kabupaten|kab\.?|kecamatan|kec\.?|kelurahan|kel\.?|desa)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw || raw === '-' || raw === 'nasional' || raw === 'indonesia' || raw === 'seluruh wilayah') {
    return '';
  }
  return raw;
}

export function isAreaMatch(a?: string | null, b?: string | null): boolean {
  const na = normalizeAreaText(a);
  const nb = normalizeAreaText(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function normalizeExactName(value?: string | null): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isExactNameMatch(a?: string | null, b?: string | null): boolean {
  const na = normalizeExactName(a);
  const nb = normalizeExactName(b);
  if (!na || !nb) return false;
  return na === nb;
}

export function isNameMatch(a?: string | null, b?: string | null): boolean {
  const na = normalizeExactName(a);
  const nb = normalizeExactName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/**
 * Extract pure inputter name from `terdaftarOleh` labels like "Relawan Budi" or "Korcam Andi".
 */
export function extractCleanPenginputName(raw?: string | null): string {
  return String(raw || '')
    .trim()
    .replace(/^(relawan|korcam|korwil|kader|tim\s*sukses|admin|super\s*admin|petugas)\s*[:\-–]?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve display name of the person who inputted a voter record.
 */
export function resolvePenginputName(voter: VoterOcrRecord): string {
  const direct = String(voter.diinputOlehNama || '').trim();
  if (direct && direct !== '-') return direct;
  const fallback = extractCleanPenginputName(voter.terdaftarOleh);
  if (fallback && fallback !== '-') return fallback;
  return String(voter.terdaftarOleh || 'Petugas Lapangan').trim();
}

/**
 * Format wilayah input string: "Kota / Kecamatan / Kelurahan" cleanly.
 */
export function formatWilayahInput(voter: VoterOcrRecord): string {
  const parts = [
    String(voter.kabupatenKota || '').trim(),
    String(voter.kecamatan || '').trim(),
    String(voter.kelurahan || '').trim(),
  ].filter((p) => p && p !== '-');
  if (parts.length === 0) return 'Wilayah belum tercatat';
  return parts.join(' / ');
}

/**
 * Derive Indonesian Provinsi cleanly from an explicit provinsi or kota/kabupaten.
 */
export function resolveAreaProvinsi(provinsi?: string | null, kota?: string | null): string {
  const rawProv = String(provinsi || '').trim();
  if (rawProv && rawProv.toLowerCase() !== 'indonesia' && rawProv !== '-') {
    return rawProv;
  }
  const kotaClean = String(kota || '').trim();
  if (kotaClean && kotaClean !== '-') {
    const detected = getProvinsiByKota(kotaClean);
    if (detected && detected !== 'Indonesia') return detected;
  }
  return '';
}

export function resolveUserProvinsi(user?: UserAccount | null): string {
  if (!user) return '';
  return resolveAreaProvinsi(user.provinsi, user.kota || user.wilayah);
}

export function resolveVoterProvinsi(voter: VoterOcrRecord): string {
  const fromField = resolveAreaProvinsi(voter.provinsi, voter.kabupatenKota);
  if (fromField) return fromField;
  return 'Lainnya / Belum Diisi';
}

export function isFieldInputtedVoter(voter: VoterOcrRecord): boolean {
  if (!voter || !voter.nama) return false;
  const namaLower = String(voter.nama).trim().toLowerCase();
  if (
    namaLower.includes('dummy') ||
    namaLower.includes('contoh') ||
    namaLower.includes('sample') ||
    namaLower.includes('test voter')
  ) {
    return false;
  }
  if (voter.diinputOlehRole === 'voter') return false;
  if (voter.registrationSource === 'google_sso' || voter.registrationSource === 'manual_signup') {
    return false;
  }
  return true;
}

/**
 * Resolve the primary city/region coverage string of a Korwil or user.
 */
export function resolveUserKotaScope(user?: UserAccount | null): string {
  if (!user) return '';
  if (normalizeAreaText(user.kota)) return String(user.kota || '').trim();
  // Extract first segment if wilayah is like "Jakarta Utara • Penjaringan" or "Kota Jakarta Utara"
  const rawWilayah = String(user.wilayah || '').trim();
  if (!rawWilayah) return '';
  const firstSegment = rawWilayah.split(/[•,/|]/)[0]?.trim() || '';
  return normalizeAreaText(firstSegment) ? firstSegment : '';
}

/**
 * Resolve all Korcam IDs & names under a Korwil (strictly within Korwil's Kota/Wilayah coverage).
 */
export function getKorcamIdsUnderKorwil(
  korwil: UserAccount,
  allUsers: UserAccount[]
): { ids: Set<string>; names: Set<string> } {
  const ids = new Set<string>();
  const names = new Set<string>();

  const korwilKota = resolveUserKotaScope(korwil);
  const korwilProv = resolveUserProvinsi(korwil);

  allUsers.forEach((u) => {
    if (!isKorcamRole(u.role)) return;

    const uKota = resolveUserKotaScope(u);
    const uProv = resolveUserProvinsi(u);

    // If both Korwil and target Korcam have a Kota/Wilayah, they MUST match strictly
    if (korwilKota && uKota) {
      if (isAreaMatch(korwilKota, uKota)) {
        ids.add(u.id);
        if (u.nama) names.add(normalizeExactName(u.nama));
      }
      return;
    }

    const directLink =
      (u.timSuksesId && u.timSuksesId === korwil.id) ||
      (u.timSuksesNama && isExactNameMatch(u.timSuksesNama, korwil.nama)) ||
      (u.didaftarkanOlehTimSukses && isExactNameMatch(u.didaftarkanOlehTimSukses, korwil.nama)) ||
      (Array.isArray(korwil.kaderIds) && korwil.kaderIds.includes(u.id));

    const sameProv = Boolean(!korwilKota && korwilProv && uProv && isAreaMatch(korwilProv, uProv));

    if (directLink || sameProv) {
      ids.add(u.id);
      if (u.nama) names.add(normalizeExactName(u.nama));
    }
  });

  return { ids, names };
}

/**
 * Strict territorial check: Does a target account (Korcam or Relawan) belong inside viewer's management scope?
 * Includes ALL statuses (Aktif, Pending, Ditolak, Nonaktif) for Kelola Relawan & Kelola Korcam dan Relawan.
 */
export function isAccountInViewerScope(
  viewer: UserAccount | null | undefined,
  target: UserAccount,
  allUsers: UserAccount[]
): boolean {
  if (!viewer || !target) return false;
  if (target.id === viewer.id) return false;

  // 1. Zuper Admin, Super Admin, Admin -> Full access
  if (isFullAccessRole(viewer.role)) {
    return true;
  }

  // 2. Relawan -> Cannot manage other accounts
  if (isRelawanRole(viewer.role)) {
    return false;
  }

  const targetIsKorcam = isKorcamRole(target.role);
  const targetIsRelawan = isRelawanRole(target.role);

  // 3. Korwil -> ONLY Korcam & Relawan inside Korwil's Kota/Wilayah coverage
  if (isKorwilRole(viewer.role)) {
    if (!targetIsKorcam && !targetIsRelawan) return false;

    const viewerKota = resolveUserKotaScope(viewer);
    const targetKota = resolveUserKotaScope(target);

    // Strict territorial boundary: if both have Kota/Wilayah, they MUST match (no cross-region leakage)
    if (viewerKota && targetKota) {
      return isAreaMatch(viewerKota, targetKota);
    }

    // If target lacks Kota metadata, fall back to Provinsi or direct hierarchy link
    const korcamsUnderMe = getKorcamIdsUnderKorwil(viewer, allUsers);
    if (targetIsKorcam && korcamsUnderMe.ids.has(target.id)) return true;

    if (
      (target.timSuksesId && target.timSuksesId === viewer.id) ||
      (target.timSuksesNama && isExactNameMatch(target.timSuksesNama, viewer.nama)) ||
      (target.didaftarkanOlehTimSukses && isExactNameMatch(target.didaftarkanOlehTimSukses, viewer.nama)) ||
      (target.korcamId && korcamsUnderMe.ids.has(target.korcamId)) ||
      (target.korcamNama && korcamsUnderMe.names.has(normalizeExactName(target.korcamNama)))
    ) {
      return true;
    }

    const viewerProv = resolveUserProvinsi(viewer);
    const targetProv = resolveUserProvinsi(target);
    if (!viewerKota && viewerProv && targetProv && isAreaMatch(viewerProv, targetProv)) {
      return true;
    }

    return false;
  }

  // 4. Korcam -> ONLY Relawan inside Korcam's Kecamatan
  if (isKorcamRole(viewer.role)) {
    if (!targetIsRelawan) return false;

    const viewerKec = String(viewer.kecamatan || '').trim();
    const viewerKota = resolveUserKotaScope(viewer);
    const targetKec = String(target.kecamatan || '').trim();
    const targetKota = resolveUserKotaScope(target);

    // Strict Kecamatan boundary: if both Korcam and Relawan have Kecamatan, they MUST match
    if (normalizeAreaText(viewerKec) && normalizeAreaText(targetKec)) {
      const kecMatch = isAreaMatch(viewerKec, targetKec);
      const kotaMatch = !viewerKota || !targetKota || isAreaMatch(viewerKota, targetKota);
      return kecMatch && kotaMatch;
    }

    // If Relawan has a different Kota explicitly, never match
    if (viewerKota && targetKota && !isAreaMatch(viewerKota, targetKota)) {
      return false;
    }

    // Fallback when target lacks kecamatan field: direct Korcam link
    if (target.korcamId && target.korcamId === viewer.id) return true;
    if (target.korcamNama && isExactNameMatch(target.korcamNama, viewer.nama)) return true;

    // Fallback if Korcam itself has no kecamatan set: match by Kota
    if (!normalizeAreaText(viewerKec) && viewerKota && targetKota && isAreaMatch(viewerKota, targetKota)) {
      return true;
    }

    return false;
  }

  return false;
}

/**
 * Filter managed accounts (all statuses: Aktif, Pending, Ditolak, Nonaktif) strictly by viewer's role & territory.
 */
export function filterManagedAccountsForUser(
  viewer: UserAccount | null | undefined,
  allUsers: UserAccount[]
): UserAccount[] {
  if (!viewer) return [];
  if (isFullAccessRole(viewer.role)) return allUsers;
  return allUsers.filter((target) => isAccountInViewerScope(viewer, target, allUsers));
}

/**
 * Check whether a target field user (Korcam or Relawan) is visible to the logged-in viewer
 * on the "Monitoring Relawan" live map dashboard (ONLY Aktif accounts).
 */
export function canViewerMonitorTarget(
  viewer: UserAccount | null | undefined,
  target: UserAccount,
  allUsers: UserAccount[]
): boolean {
  if (!viewer || !target) return false;
  // Exclude Pending, Ditolak, and Nonaktif from active Live GPS Monitoring
  if (target.status && target.status !== 'Aktif') return false;

  const targetIsKorcam = isKorcamRole(target.role);
  const targetIsRelawan = isRelawanRole(target.role);
  if (!targetIsKorcam && !targetIsRelawan) return false;

  if (isFullAccessRole(viewer.role)) {
    return true;
  }

  return isAccountInViewerScope(viewer, target, allUsers);
}

/**
 * Check if a voter was strictly inputted by a specific Relawan account.
 */
export function isVoterInputtedByRelawan(viewer: UserAccount, voter: VoterOcrRecord): boolean {
  // If createdById is recorded, strictly compare IDs so different relawan with similar names never collide
  if (voter.createdById) {
    return voter.createdById === viewer.id;
  }
  if (voter.diinputOlehNama && isExactNameMatch(voter.diinputOlehNama, viewer.nama)) {
    return true;
  }
  if (voter.terdaftarOleh) {
    const cleanTerdaftar = extractCleanPenginputName(voter.terdaftarOleh);
    if (isExactNameMatch(cleanTerdaftar, viewer.nama) || isExactNameMatch(voter.terdaftarOleh, viewer.nama)) {
      return true;
    }
  }
  return false;
}

/**
 * Global Role-Based Voter/Konstituen Filter (used across Dashboard, Database Konstituen, & Peta Suara):
 * - Admin / Super Admin / Zuper Admin: all field voters across Indonesia.
 * - Korwil: strictly voters inside Korwil's Kota/Wilayah coverage (no cross-region leakage).
 * - Korcam: strictly voters inside Korcam's Kecamatan (e.g. Penjaringan only).
 * - Relawan: strictly ONLY voters inputted by that Relawan themselves.
 */
export function filterScopedVotersForUser(
  viewer: UserAccount | null | undefined,
  voters: VoterOcrRecord[],
  allUsers: UserAccount[]
): VoterOcrRecord[] {
  const cleanFieldVoters = voters.filter(isFieldInputtedVoter);
  if (!viewer) return cleanFieldVoters;

  // 1. Zuper Admin, Super Admin, Admin -> Full Access
  if (isFullAccessRole(viewer.role)) {
    return cleanFieldVoters;
  }

  // 2. Relawan -> STRICTLY ONLY voters inputted by this Relawan themselves
  if (isRelawanRole(viewer.role)) {
    return cleanFieldVoters.filter((v) => isVoterInputtedByRelawan(viewer, v));
  }

  // 3. Korcam -> STRICTLY voters inside Korcam's Kecamatan (no data from other Kecamatan)
  if (isKorcamRole(viewer.role)) {
    const viewerKec = String(viewer.kecamatan || '').trim();
    const viewerKota = resolveUserKotaScope(viewer);

    const myRelawan = filterManagedAccountsForUser(viewer, allUsers);
    const allowedCreatorIds = new Set<string>([viewer.id, ...myRelawan.map((u) => u.id)]);
    const allowedCreatorNames = new Set<string>([
      normalizeExactName(viewer.nama),
      ...myRelawan.map((u) => normalizeExactName(u.nama)),
    ]);

    return cleanFieldVoters.filter((v) => {
      const voterKec = String(v.kecamatan || '').trim();
      const voterKota = String(v.kabupatenKota || '').trim();

      // Primary strict boundary: if Korcam has Kecamatan AND voter has Kecamatan, MUST match Kecamatan (+ Kota if present)
      if (normalizeAreaText(viewerKec) && normalizeAreaText(voterKec)) {
        const kecMatch = isAreaMatch(viewerKec, voterKec);
        const kotaMatch = !viewerKota || !normalizeAreaText(voterKota) || isAreaMatch(viewerKota, voterKota);
        return kecMatch && kotaMatch;
      }

      // If voter explicitly belongs to a different Kota than Korcam, reject
      if (viewerKota && normalizeAreaText(voterKota) && !isAreaMatch(viewerKota, voterKota)) {
        return false;
      }

      // Fallback when voter lacks kecamatan or Korcam lacks kecamatan: creator/team match
      if (v.korcamId && v.korcamId === viewer.id) return true;
      if (v.createdById && allowedCreatorIds.has(v.createdById)) return true;
      if (v.diinputOlehNama && allowedCreatorNames.has(normalizeExactName(v.diinputOlehNama))) return true;
      if (v.terdaftarOleh) {
        const cleanName = normalizeExactName(extractCleanPenginputName(v.terdaftarOleh));
        if (cleanName && allowedCreatorNames.has(cleanName)) return true;
      }

      // Fallback if Korcam only has Kota configured (no kecamatan)
      if (!normalizeAreaText(viewerKec) && viewerKota && normalizeAreaText(voterKota)) {
        return isAreaMatch(viewerKota, voterKota);
      }

      return false;
    });
  }

  // 4. Korwil -> STRICTLY voters inside Korwil's Kota/Wilayah coverage (no data from other Kota/Wilayah)
  if (isKorwilRole(viewer.role)) {
    const viewerKota = resolveUserKotaScope(viewer);
    const viewerProv = resolveUserProvinsi(viewer);

    const myTeam = filterManagedAccountsForUser(viewer, allUsers);
    const korcamsUnderMe = getKorcamIdsUnderKorwil(viewer, allUsers);
    const allowedCreatorIds = new Set<string>([
      viewer.id,
      ...Array.from(korcamsUnderMe.ids),
      ...myTeam.map((u) => u.id),
    ]);
    const allowedCreatorNames = new Set<string>([
      normalizeExactName(viewer.nama),
      ...Array.from(korcamsUnderMe.names),
      ...myTeam.map((u) => normalizeExactName(u.nama)),
    ]);

    return cleanFieldVoters.filter((v) => {
      const voterKota = String(v.kabupatenKota || '').trim();

      // Primary strict boundary: if Korwil has Kota/Wilayah AND voter has kabupatenKota, MUST match strictly
      if (viewerKota && normalizeAreaText(voterKota)) {
        return isAreaMatch(viewerKota, voterKota);
      }

      // Fallback when voter lacks kabupatenKota: creator/team match
      if (v.korwilId && v.korwilId === viewer.id) return true;
      if (v.korcamId && korcamsUnderMe.ids.has(v.korcamId)) return true;
      if (v.createdById && allowedCreatorIds.has(v.createdById)) return true;
      if (v.diinputOlehNama && allowedCreatorNames.has(normalizeExactName(v.diinputOlehNama))) return true;
      if (v.terdaftarOleh) {
        const cleanName = normalizeExactName(extractCleanPenginputName(v.terdaftarOleh));
        if (cleanName && allowedCreatorNames.has(cleanName)) return true;
      }

      // Fallback if Korwil is Provinsi-level (no Kota set)
      if (!viewerKota && viewerProv) {
        const vProv = resolveAreaProvinsi(v.provinsi, v.kabupatenKota);
        if (vProv && isAreaMatch(viewerProv, vProv)) return true;
      }

      return false;
    });
  }

  return [];
}

/**
 * Alias preserved for Peta Suara module — enforces the exact same global role & territorial scoping.
 */
export function filterScopedVotersForPetaSuara(
  viewer: UserAccount | null | undefined,
  voters: VoterOcrRecord[],
  allUsers: UserAccount[]
): VoterOcrRecord[] {
  return filterScopedVotersForUser(viewer, voters, allUsers);
}

/**
 * Helper to resolve hierarchy metadata (createdById, korcamId, korwilId) when saving a new Voter.
 */
export function resolveVoterCreatorHierarchy(
  creator: UserAccount | null | undefined,
  allUsers: UserAccount[]
): { createdById?: string; korcamId?: string; korwilId?: string } {
  if (!creator) return {};
  const createdById = creator.id;
  let korcamId: string | undefined;
  let korwilId: string | undefined;

  if (isKorwilRole(creator.role)) {
    korwilId = creator.id;
  } else if (isKorcamRole(creator.role)) {
    korcamId = creator.id;
    korwilId = creator.timSuksesId;
  } else if (isRelawanRole(creator.role)) {
    korcamId = creator.korcamId;
    korwilId = creator.timSuksesId;
    if (!korwilId && korcamId) {
      const parentKorcam = allUsers.find((u) => u.id === korcamId);
      if (parentKorcam?.timSuksesId) {
        korwilId = parentKorcam.timSuksesId;
      }
    }
  }

  return { createdById, korcamId, korwilId };
}
