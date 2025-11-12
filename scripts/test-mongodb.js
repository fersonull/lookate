// Test MongoDB Connection
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  console.log('🔗 Testing MongoDB connection...');
  console.log('URI:', MONGODB_URI ? MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') : 'NOT SET');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    
    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📊 Database: ${db.databaseName}`);
    console.log(`📂 Collections: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None (new database)'}`);
    
    // Test creating a simple document
    const testCollection = db.collection('test');
    await testCollection.insertOne({ 
      message: 'lookate connection test', 
      timestamp: new Date() 
    });
    console.log('✅ Test document created successfully');
    
    // Clean up test document
    await testCollection.deleteOne({ message: 'lookate connection test' });
    console.log('🧹 Test document cleaned up');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('   - Username and password are correct');
      console.log('   - Database user has proper permissions');
      console.log('   - IP address is whitelisted in MongoDB Atlas');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DNS resolution failed. Please check:');
      console.log('   - Internet connection');
      console.log('   - Cluster URL is correct');
    }
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testConnection();