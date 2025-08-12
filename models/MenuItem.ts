import mongoose, { Schema } from 'mongoose';

const MenuItemSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);
