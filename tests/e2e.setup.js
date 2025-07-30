const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://suryapoojith9805:C5kciaQg1n0cQYkG@cluster0.q2gp6pt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});

afterAll(async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            const collections = mongoose.connection.collections;
            for (const key in collections) {
                await collections[key].deleteMany();
            }
        }
    } catch (error) {
        console.log('Cleanup error:', error.message);
    }
}); 