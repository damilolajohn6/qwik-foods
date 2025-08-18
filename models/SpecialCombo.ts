import mongoose, { Schema, Document } from 'mongoose';

export interface IComboItem {
    _id: mongoose.Types.ObjectId;
    quantity: number;
}

export interface ISpecialCombo extends Document {
    name: string;
    description: string;
    items: IComboItem[];
    totalPrice: number;
    imageUrl: string;
    available: boolean;
    featured: boolean; 
    createdAt: Date;
    updatedAt: Date;
}

const ComboItemSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
}, { _id: false });

const SpecialComboSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    items: {
        type: [ComboItemSchema],
        required: true,
        validate: (v: IComboItem[]) => Array.isArray(v) && v.length > 0,
        message: 'A combo must have at least one item.'
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    imageUrl: {
        type: String,
        required: true,
        validate: {
            validator: (v: string) => /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v),
            message: 'Invalid image URL format'
        }
    },
    available: {
        type: Boolean,
        default: true,
    },
    featured: {
        type: Boolean,
        default: false,
        index: true,
    },
}, { timestamps: true });

// Pre-save middleware to calculate total price and ensure an image URL
SpecialComboSchema.pre('save', async function (next) {
    // In a real-world app, you might want to automatically calculate totalPrice here
    // based on the prices of the referenced menu items.
    // For now, we'll assume the totalPrice is set manually.
    next();
});

export default mongoose.models.SpecialCombo || mongoose.model<ISpecialCombo>('SpecialCombo', SpecialComboSchema);
