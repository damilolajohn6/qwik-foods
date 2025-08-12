import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseGlobal {
    mongoose: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    };
}

declare const global: typeof globalThis & MongooseGlobal;

if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (global.mongoose.conn) {
        return global.mongoose.conn;
    }

    if (!global.mongoose.promise) {
        const opts = {
            bufferCommands: false,
        };

        global.mongoose.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
    }

    global.mongoose.conn = await global.mongoose.promise;
    return global.mongoose.conn;
}

export default connectDB;
