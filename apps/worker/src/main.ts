import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { parseEnv } from '@sanctra/config';
import { QUEUE_NAMES } from '@sanctra/shared';

const env = parseEnv();
const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const analysisWorker = new Worker(
  QUEUE_NAMES.analysis,
  async (job) => {
    console.info(`Received ${job.name} job ${job.id ?? 'without-id'}`);
    return { status: 'accepted' };
  },
  { connection },
);

analysisWorker.on('completed', (job) => {
  console.info(`Completed analysis job ${job.id ?? 'without-id'}`);
});

analysisWorker.on('failed', (job, error) => {
  console.error(`Analysis job ${job?.id ?? 'without-id'} failed`, error);
});

const shutdown = async (signal: string): Promise<void> => {
  console.info(`Received ${signal}; shutting down worker`);
  await analysisWorker.close();
  await connection.quit();
};

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
