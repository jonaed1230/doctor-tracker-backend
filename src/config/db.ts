import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongodInstance: any = null;

export const connectDB = async (customUri?: string): Promise<string> => {
  const uri = customUri || ENV.MONGODB_URI;

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] Connected successfully to MongoDB: ${uri}`);
    return uri;
  } catch (err: any) {
    console.warn(`[Database] Could not connect to MongoDB at ${uri}: ${err.message}`);
    console.log(`[Database] Attempting to fallback to MongoMemoryServer...`);

    try {
      process.env.MONGOMS_VERSION = '7.0.24';
      process.env.MONGOMS_DISABLE_POSTINSTALL = '1';
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        binary: { version: '7.0.24' },
      });
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to In-Memory MongoDB at: ${memoryUri}`);
      return memoryUri;
    } catch (memErr: any) {
      console.error(`[Database] Failed to initialize In-Memory MongoDB: ${memErr.message}`);
      throw new Error(`Database connection failed: ${err.message} and ${memErr.message}`);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
  } catch (err) {
    console.error('[Database] Disconnect error:', err);
  }
};
