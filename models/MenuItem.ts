import mongoose, { Schema } from 'mongoose';

const AddOnSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
});

const MenuItemSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String },
    oldPrice: { type: Number },
    addOns: [AddOnSchema],
    popular: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);