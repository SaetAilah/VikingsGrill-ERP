import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT || 4000),
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'vikings_erp',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

export default env;

