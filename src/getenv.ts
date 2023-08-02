import dotenv from 'dotenv';
dotenv.config();

export function getEnv(key: string, default_value?: any) {
  return process.env[key] ?? default_value;
}
