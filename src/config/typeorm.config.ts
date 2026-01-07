// import { DataSource } from 'typeorm';
// import { config } from 'dotenv';

// // Load environment variables
// config();

// export default new DataSource({
//   type: 'postgres',
//   host: process.env.DB_HOST || 'localhost',
//   port: parseInt(process.env.DB_PORT || '5432', 10),
//   username: process.env.DB_USERNAME || 'postgres',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_DATABASE || 'mummymap',
//   entities: ['src/**/*.entity{.ts,.js}'],
//   migrations: ['src/database/migrations/*{.ts,.js}'],
//   synchronize: false,
//   logging: true,
// });

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'mummymap',

  // ✅ IMPORTANT: absolute paths
  entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],

  synchronize: false,
  logging: true,
});
