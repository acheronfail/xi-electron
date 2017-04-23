import path from 'path';

// Environment variables.
export const DEV = process.env.NODE_ENV == 'development';
export const PROD = process.env.NODE_ENV == 'production';

// Paths.
export const CORE_PATH = path.resolve(__dirname, 'xi-core', 'xi-core');
