import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {db} from './connection';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function migrate(): void {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
}

// Run directly: `npm run db:reset` (optionally with --seed)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  migrate();
  if (process.argv.includes('--seed')) {
    const {seed} = await import('./seed');
    seed();
    console.log('Database migrated and seeded.');
  } else {
    console.log('Database migrated.');
  }
}
