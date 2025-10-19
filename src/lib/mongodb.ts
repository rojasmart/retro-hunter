import { MongoClient, Db } from 'mongodb';
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, use uma variável global para preservar o valor
  // através de reloads do módulo causados pelo HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Em produção, é melhor não usar uma variável global.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Conexão do Mongoose (para schemas mais estruturados)
let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'retro-hunter',
    });
    isConnected = true;
    console.log('Connected to MongoDB with Mongoose');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Export a MongoClient promise
export default clientPromise;

// Helper para obter database
export const getDatabase = async (): Promise<Db> => {
  const client = await clientPromise;
  return client.db('retro-hunter');
};
