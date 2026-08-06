import bcrypt from "bcrypt";
export async function hashPassword(value: string, hashSalt = 11) {
  if (hashSalt < 0 || hashSalt > 100) {
    hashSalt = 10;
  }
  return await bcrypt.hash(value, hashSalt);
}

export async function comparePassword(
  candidatePassword: string,
  originalPassword: string,
) {
  return await bcrypt.compare(candidatePassword, originalPassword);
}
