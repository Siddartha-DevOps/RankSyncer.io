import CryptoJS from 'crypto-js';
import { config } from '../config/env';

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, config.ENCRYPTION_KEY).toString();
};

export const decrypt = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, config.ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
};
