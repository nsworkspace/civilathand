import { MongoClient } from "mongodb";

/**
 * Single MongoDB connection shared by every serverless invocation within the
 * same warm runtime. The URI is read only from the deployment environment;
 * no Atlas/project/cluster credentials are stored in source control.
 */
const uri = process.env.MONGODB_URI?.trim();

const options = {
  connectTimeoutMS: 8_000,
  serverSelectionTimeoutMS: 8_000,
  socketTimeoutMS: 30_000,
  maxPoolSize: 10,
  minPoolSize: 0,
  retryWrites: true,
};

type MongoGlobal = typeof globalThis & {
  __cahMongoClientPromise?: Promise<MongoClient>;
};

const globalMongo = globalThis as MongoGlobal;

function createClientPromise(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(
      new Error('Invalid/Missing environment variable: "MONGODB_URI"')
    );
  }

  const client = new MongoClient(uri, options);
  let trackedPromise: Promise<MongoClient>;
  trackedPromise = client.connect().catch((error) => {
    // Do not poison a warm serverless worker with a permanently rejected
    // connection promise. A transient Atlas election/network failure should
    // be retried by the next request.
    if (globalMongo.__cahMongoClientPromise === trackedPromise) {
      globalMongo.__cahMongoClientPromise = undefined;
    }
    void client.close().catch(() => undefined);
    throw error;
  });

  return trackedPromise;
}

/**
 * Reusing a successful connection is important on Vercel/Next.js, but failed
 * initial connections must remain retryable. The previous implementation
 * cached a rejected promise forever for that warm runtime.
 */
function getClientPromise(): Promise<MongoClient> {
  if (!globalMongo.__cahMongoClientPromise) {
    globalMongo.__cahMongoClientPromise = createClientPromise();
  }
  return globalMongo.__cahMongoClientPromise;
}

// Keep the default export compatible with all existing API routes.
const clientPromise = getClientPromise();
clientPromise.catch(() => undefined);
export default clientPromise;
