import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.log("DEBUG: Contenu de process.env.DATABASE_URL :", connectionString);
  throw new Error("DATABASE_URL is not defined in .env file");
}
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
