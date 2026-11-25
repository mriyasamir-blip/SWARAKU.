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
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^(provinsi|prov\.?|kota|kabupaten|kab\.?|kecamatan|kec\.?|kelurahan|kel\.?|desa)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isAreaMatch(a?: string | null, b?: string | null): boolean {
  const na = normalizeAreaText(a);
  const nb = normalizeAreaText(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function isNameMatch(a?: string | null, b?: string | null): boolean {
  const na = String(a || '').trim().toLowerCase();
  const nb = String(b || '').trim().toLowerCase();
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
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
  // Exclude dummy/sample placeholders
  if (
    namaLower.includes('dummy') ||
    namaLower.includes('contoh') ||
    namaLower.includes('sample') ||
    namaLower.includes('test voter')
  ) {
    return false;
  }
  // Keep voters inputted by Korwil, Korcam, Relawan, or Admin/Staff (or OCR KTP / lapangan / command_regist)
  if (voter.diinputOlehRole === 'voter') return false;
  if (voter.registrationSource === 'google_sso' || voter.registrationSource === 'manual_signup') {
    return false;
  }
  return true;
}

/**
 * Resolve all Korcam IDs & names under a Korwil (by direct ID relation OR Provinsi/Kota territory).
 */
export function getKorcamIdsUnderKorwil(
  korwil: UserAccount,
  allUsers: UserAccount[]
): { ids: Set<string>; names: Set<string> } {
  const ids = new Set<string>();
  const names = new Set<string>();

  if (Array.isArray(korwil.kaderIds)) {
    korwil.kaderIds.forEach((id) => id && ids.add(id));
  }
  if (Array.isArray(korwil.kaderList)) {
    korwil.kaderList.forEach((n) => n && names.add(n.trim().toLowerCase()));
  }

  const korwilKota = korwil.kota || korwil.wilayah || '';
  const korwilProv = resolveUserProvinsi(korwil);

  allUsers.forEach((u) => {
    if (!isKorcamRole(u.role)) return;
    const directLink =
      (u.timSuksesId && u.timSuksesId === korwil.id) ||
      (u.timSuksesNama && isNameMatch(u.timSuksesNama, korwil.nama)) ||
      (u.didaftarkanOlehTimSukses && isNameMatch(u.didaftarkanOlehTimSukses, korwil.nama)) ||
      ids.has(u.id) ||
      names.has(u.nama.trim().toLowerCase());

    const uKota = u.kota || u.wilayah || '';
    const uProv = resolveUserProvinsi(u);
    const sameKota = Boolean(korwilKota && uKota && isAreaMatch(korwilKota, uKota));
    const sameProv = Boolean(
      !korwilKota && korwilProv && uProv && isAreaMatch(korwilProv, uProv)
    );

    if (directLink || sameKota || sameProv) {
      ids.add(u.id);
      if (u.nama) names.add(u.nama.trim().toLowerCase());
    }
  });

  return { ids, names };
}

/**
 * Check whether a target field user (Korcam or Relawan) is visible to the logged-in viewer
 * on the "Monitoring Relawan" dashboard.
 */
export function canViewerMonitorTarget(
  viewer: UserAccount | null | undefined,
  target: UserAccount,
  allUsers: UserAccount[]
): boolean {
  if (!viewer || !target) return false;
  if (target.status === 'Nonaktif') return false;

  // Monitoring Relawan tracks field team: Korcam + Relawan
  const targetIsKorcam = isKorcamRole(target.role);
  const targetIsRelawan = isRelawanRole(target.role);
  if (!targetIsKorcam && !targetIsRelawan) return false;

  // 1. Zuper Admin, Super Admin, Admin -> Full Access (all Korcam & Relawan)
  if (isFullAccessRole(viewer.role)) {
    return true;
  }

  // 2. Relawan -> Blocked from Monitoring Relawan
  if (isRelawanRole(viewer.role)) {
    return false;
  }

  // 3. Korwil -> Korcam & Relawan under their territory or team ID link
  if (isKorwilRole(viewer.role)) {
    const korcamsUnderMe = getKorcamIdsUnderKorwil(viewer, allUsers);
    const viewerKota = viewer.kota || viewer.wilayah || '';
    const viewerProv = resolveUserProvinsi(viewer);
    const targetKota = target.kota || target.wilayah || '';
    const targetProv = resolveUserProvinsi(target);

    if (targetIsKorcam) {
      if (korcamsUnderMe.ids.has(target.id)) return true;
      if (target.nama && korcamsUnderMe.names.has(target.nama.trim().toLowerCase())) return true;
    }

    // Relawan directly linked to this Korwil or to a Korcam under this Korwil
    if (
      (target.timSuksesId && target.timSuksesId === viewer.id) ||
      (target.timSuksesNama && isNameMatch(target.timSuksesNama, viewer.nama)) ||
      (target.didaftarkanOlehTimSukses && isNameMatch(target.didaftarkanOlehTimSukses, viewer.nama)) ||
      (target.korcamId && korcamsUnderMe.ids.has(target.korcamId)) ||
      (target.korcamNama && korcamsUnderMe.names.has(target.korcamNama.trim().toLowerCase()))
    ) {
      return true;
    }

    // Territory match (Kota-Kabupaten or Provinsi)
    if (viewerKota && targetKota && isAreaMatch(viewerKota, targetKota)) return true;
    if (!viewerKota && viewerProv && targetProv && isAreaMatch(viewerProv, targetProv)) return true;
    return false;
  }

  // 4. Korcam -> ONLY Relawan under their Kecamatan/Kota or team ID link
  if (isKorcamRole(viewer.role)) {
    if (!targetIsRelawan) return false;

    // Direct relation by Korcam ID or Name
    if (target.korcamId && target.korcamId === viewer.id) return true;
    if (target.korcamNama && isNameMatch(target.korcamNama, viewer.nama)) return true;

    // Territory match by Kecamatan (preferred) or Kota if viewer has no Kecamatan set
    const viewerKec = viewer.kecamatan || '';
    const viewerKota = viewer.kota || '';
    const targetKec = target.kecamatan || '';
    const targetKota = target.kota || '';

    if (viewerKec && targetKec && isAreaMatch(viewerKec, targetKec)) {
      if (!viewerKota || !targetKota || isAreaMatch(viewerKota, targetKota)) {
        return true;
      }
    }
    if (!viewerKec && viewerKota && targetKota && isAreaMatch(viewerKota, targetKota)) {
      return true;
    }

    return false;
  }

  return false;
}

/**
 * Filter Voters/Konstituen strictly by role & territorial hierarchy for "Peta Suara".
 */
export function filterScopedVotersForPetaSuara(
  viewer: UserAccount | null | undefined,
  voters: VoterOcrRecord[],
  allUsers: UserAccount[]
): VoterOcrRecord[] {
  // Always exclude dummy / sample / non-field voters first
  const cleanFieldVoters = voters.filter(isFieldInputtedVoter);
  if (!viewer) return cleanFieldVoters;

  // 1. Zuper Admin, Super Admin, Admin -> Full Access to all field voters across Indonesia
  if (isFullAccessRole(viewer.role)) {
    return cleanFieldVoters;
  }

  // 2. Relawan -> ONLY voters inputted by this Relawan themselves
  if (isRelawanRole(viewer.role)) {
    return cleanFieldVoters.filter((v) => {
      if (v.createdById && v.createdById === viewer.id) return true;
      if (v.diinputOlehNama && isNameMatch(v.diinputOlehNama, viewer.nama)) return true;
      if (v.terdaftarOleh && isNameMatch(v.terdaftarOleh, viewer.nama)) return true;
      return false;
    });
  }

  // 3. Korcam -> Voters inputted by this Korcam OR by Relawan under their territory/team
  if (isKorcamRole(viewer.role)) {
    const myTeamUsers = allUsers.filter((u) => canViewerMonitorTarget(viewer, u, allUsers));
    const allowedCreatorIds = new Set<string>([viewer.id, ...myTeamUsers.map((u) => u.id)]);
    const allowedCreatorNames = new Set<string>([
      viewer.nama.trim().toLowerCase(),
      ...myTeamUsers.map((u) => u.nama.trim().toLowerCase()),
    ]);

    const viewerKec = viewer.kecamatan || '';
    const viewerKota = viewer.kota || '';

    return cleanFieldVoters.filter((v) => {
      if (v.korcamId && v.korcamId === viewer.id) return true;
      if (v.createdById && allowedCreatorIds.has(v.createdById)) return true;
      if (v.diinputOlehNama && allowedCreatorNames.has(v.diinputOlehNama.trim().toLowerCase())) {
        return true;
      }
      if (v.terdaftarOleh) {
        const tLower = v.terdaftarOleh.trim().toLowerCase();
        for (const allowedName of allowedCreatorNames) {
          if (allowedName && tLower.includes(allowedName)) return true;
        }
      }
      // Fallback territorial scope for historical voters without createdById
      if (!v.createdById && !v.korcamId && viewerKec && v.kecamatan) {
        const kecMatch = isAreaMatch(viewerKec, v.kecamatan);
        const kotaMatch = !viewerKota || !v.kabupatenKota || isAreaMatch(viewerKota, v.kabupatenKota);
        if (kecMatch && kotaMatch) return true;
      }
      return false;
    });
  }

  // 4. Korwil -> Voters inputted by this Korwil OR by Korcam & Relawan under their territory/team
  if (isKorwilRole(viewer.role)) {
    const myTeamUsers = allUsers.filter((u) => canViewerMonitorTarget(viewer, u, allUsers));
    const korcamsUnderMe = getKorcamIdsUnderKorwil(viewer, allUsers);

    const allowedCreatorIds = new Set<string>([
      viewer.id,
      ...Array.from(korcamsUnderMe.ids),
      ...myTeamUsers.map((u) => u.id),
    ]);
    const allowedCreatorNames = new Set<string>([
      viewer.nama.trim().toLowerCase(),
      ...Array.from(korcamsUnderMe.names),
      ...myTeamUsers.map((u) => u.nama.trim().toLowerCase()),
    ]);

    const viewerKota = viewer.kota || viewer.wilayah || '';
    const viewerProv = resolveUserProvinsi(viewer);

    return cleanFieldVoters.filter((v) => {
      if (v.korwilId && v.korwilId === viewer.id) return true;
      if (v.korcamId && korcamsUnderMe.ids.has(v.korcamId)) return true;
      if (v.createdById && allowedCreatorIds.has(v.createdById)) return true;
      if (v.diinputOlehNama && allowedCreatorNames.has(v.diinputOlehNama.trim().toLowerCase())) {
        return true;
      }
      if (v.terdaftarOleh) {
        const tLower = v.terdaftarOleh.trim().toLowerCase();
        for (const allowedName of allowedCreatorNames) {
          if (allowedName && tLower.includes(allowedName)) return true;
        }
      }
      // Fallback territorial scope for historical voters without creator relation IDs
      if (!v.createdById && !v.korwilId) {
        if (viewerKota && v.kabupatenKota && isAreaMatch(viewerKota, v.kabupatenKota)) return true;
        if (!viewerKota && viewerProv) {
          const vProv = resolveAreaProvinsi(v.provinsi, v.kabupatenKota);
          if (vProv && isAreaMatch(viewerProv, vProv)) return true;
        }
      }
      return false;
    });
  }

  return [];
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
