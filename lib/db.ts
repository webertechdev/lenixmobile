import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/drizzle/schema'

const connectionString = process.env.DATABASE_URL
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

if (!connectionString && !isBuild) {
  console.warn("DATABASE_URL is not set. Please check your environment variables.");
}

const client = connectionString 
  ? postgres(connectionString, { 
      prepare: false,
      connect_timeout: 10,
      onnotice: () => {},
    }) 
  : null;

export const db = client 
  ? drizzle(client, { schema }) 
  : (null as any);
