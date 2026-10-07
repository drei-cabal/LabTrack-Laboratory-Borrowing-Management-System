import 'dotenv/config';
import { initDatabase } from './config/database';
import app from './app';

const PORT = process.env.PORT ?? 3001;

async function bootstrap() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`LabTrack Server running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Failed to initialize and start:', err);
  process.exit(1);
});
