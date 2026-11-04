import { db } from './index.ts';
import { users, voters, aspirasi, quickCountTps } from './schema.ts';
import { desc, eq } from 'drizzle-orm';

// Helper: Get or create user
export async function getOrCreateUser(uid: string, email: string, nama?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        nama: nama || email.split('@')[0],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(nama ? { nama } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to get or create user:', error);
    throw new Error('Database operation failed. Please try again later.', { cause: error });
  }
}

// Helper: Save voter from OCR
export async function insertVoter(voterData: typeof voters.$inferInsert) {
  try {
    const result = await db.insert(voters)
      .values(voterData)
      .onConflictDoUpdate({
        target: voters.nik,
        set: {
          nama: voterData.nama,
          tempatTglLahir: voterData.tempatTglLahir,
          jenisKelamin: voterData.jenisKelamin,
          alamat: voterData.alamat,
          rtRw: voterData.rtRw,
          kelurahan: voterData.kelurahan,
          kecamatan: voterData.kecamatan,
          tps: voterData.tps,
          noHp: voterData.noHp,
          fotoKtpUrl: voterData.fotoKtpUrl,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to insert voter:', error);
    throw new Error('Failed to save voter record.', { cause: error });
  }
}

// Helper: Get all voters
export async function getAllVoters() {
  try {
    return await db.select().from(voters).orderBy(desc(voters.createdAt));
  } catch (error) {
    console.error('Failed to get voters:', error);
    throw new Error('Failed to retrieve voters.', { cause: error });
  }
}

// Helper: Get voter by NIK
export async function getVoterByNik(nik: string) {
  try {
    const clean = String(nik).replace(/\D/g, '');
    const queryPromise = db.select().from(voters).where(eq(voters.nik, clean)).limit(1);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
    const result = await Promise.race([queryPromise, timeoutPromise]);
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null;
  } catch (error) {
    console.warn('Database query getVoterByNik fallback:', error);
    return null;
  }
}

// Helper: Get all aspirasi
export async function getAllAspirasi() {
  try {
    return await db.select().from(aspirasi).orderBy(desc(aspirasi.createdAt));
  } catch (error) {
    console.error('Failed to get aspirasi:', error);
    throw new Error('Failed to retrieve aspirasi.', { cause: error });
  }
}

// Helper: Insert aspirasi
export async function insertAspirasi(data: typeof aspirasi.$inferInsert) {
  try {
    const result = await db.insert(aspirasi).values(data).returning();
    return result[0];
  } catch (error) {
    console.error('Failed to insert aspirasi:', error);
    throw new Error('Failed to save aspirasi.', { cause: error });
  }
}

// Helper: Get quick count
export async function getQuickCountResults() {
  try {
    return await db.select().from(quickCountTps).orderBy(desc(quickCountTps.createdAt));
  } catch (error) {
    console.error('Failed to get quick count:', error);
    throw new Error('Failed to retrieve quick count data.', { cause: error });
  }
}
