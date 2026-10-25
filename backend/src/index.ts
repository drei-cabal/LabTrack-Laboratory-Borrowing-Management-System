import 'dotenv/config';
import { initDatabase } from './config/database';
import app from './app';

const PORT = Number(process.env.PORT ?? 3001);

async function bootstrap() {
  await initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LabTrack Backend REST API running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Backend] Failed to initialize and start:', err);
  process.exit(1);
});
