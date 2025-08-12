import mongoose, { Schema } from 'mongoose';

const OrderSchema = new Schema({
    userId: { type: String, required: true },
    items: [
        {
            menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
            quantity: { type: Number, required: true },
        },
    ],
    total: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
