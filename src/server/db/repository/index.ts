import { IRepository } from './IRepository.js';
import { JsonRepository } from './JsonRepository.js';
import { PostgresRepository } from './PostgresRepository.js';

let activeRepo: IRepository | null = null;

export async function getDbRepository(): Promise<IRepository> {
  if (activeRepo) return activeRepo;

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (dbUrl) {
    console.log('[Repository] Inicializando PostgresRepository backend con PostgreSQL...');
    activeRepo = new PostgresRepository(dbUrl);
  } else {
    console.log('[Repository] Inicializando JsonRepository con persistencia local en data/registria_db.json...');
    activeRepo = new JsonRepository();
  }

  await activeRepo.init();
  return activeRepo;
}
