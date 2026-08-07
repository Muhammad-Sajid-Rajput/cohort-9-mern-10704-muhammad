import bcrypt from 'bcrypt';

export async function hashPassword(value: string, hashSalt = 11) {
  try {
    if (hashSalt < 0 || hashSalt > 100) {
      hashSalt = 10;
    }
    return await bcrypt.hash(value, hashSalt);
  } catch (e) {
    throw new Error(
      `Password hashing failed: ${e instanceof Error ? e.message : e}`,
    );
  }
}

export async function comparePassword(
  candidatePassword: string,
  originalPassword: string,
) {
  try {
    return await bcrypt.compare(candidatePassword, originalPassword);
  } catch (e) {
    throw new Error(
      `Password comparison failed: ${e instanceof Error ? e.message : e}`,
    );
  }
}
