import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const sourceUri = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017';
const targetUri = process.env.PROD_MONGODB_URI;

async function migrateDatabase() {
  if (!targetUri) {
    throw new Error('PROD_MONGODB_URI environment variable is required');
  }

  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    await sourceClient.connect();
    await targetClient.connect();

    console.log('Connected to both databases');

    const sourceDb = sourceClient.db();
    const targetDb = targetClient.db();

    // Get all collections from source database
    const collections = await sourceDb.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Migrating collection: ${collectionName}`);

      // Get all documents from source collection
      const documents = await sourceDb.collection(collectionName).find({}).toArray();
      
      if (documents.length > 0) {
        // Insert documents into target collection
        await targetDb.collection(collectionName).insertMany(documents);
        console.log(`Migrated ${documents.length} documents from ${collectionName}`);
      } else {
        console.log(`No documents to migrate in ${collectionName}`);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

migrateDatabase().catch(console.error); 