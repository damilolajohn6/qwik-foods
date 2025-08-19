import mongoose, { Schema, Document, Model } from 'mongoose';

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

// Enhanced ComboItem schema with better validation
const ComboItemSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: [true, 'Menu item ID is required'],
        validate: {
            validator: function (v: mongoose.Types.ObjectId) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: 'Invalid menu item ID format'
        }
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        max: [99, 'Quantity cannot exceed 99'],
        validate: {
            validator: function (v: number) {
                return Number.isInteger(v) && v > 0;
            },
            message: 'Quantity must be a positive integer'
        }
    },
}, {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Main SpecialCombo schema with comprehensive validation
const SpecialComboSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Combo name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
        unique: true,
        index: true,
        validate: {
            validator: function (v: string) {
                // Basic profanity and HTML tag check
                return !/(<script|<iframe|javascript:|<object)/i.test(v);
            },
            message: 'Name contains invalid characters'
        }
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [500, 'Description cannot exceed 500 characters'],
        validate: {
            validator: function (v: string) {
                // Basic HTML tag check
                return !/(<script|<iframe|javascript:|<object)/i.test(v);
            },
            message: 'Description contains invalid characters'
        }
    },
    items: {
        type: [ComboItemSchema],
        required: [true, 'Items are required'],
        validate: [
            {
                validator: function (v: IComboItem[]) {
                    return Array.isArray(v) && v.length > 0;
                },
                message: 'A combo must have at least one item'
            },
            {
                validator: function (v: IComboItem[]) {
                    return v.length <= 20; // Reasonable limit
                },
                message: 'A combo cannot have more than 20 items'
            },
            {
                validator: function (v: IComboItem[]) {
                    // Check for duplicate items
                    const ids = v.map(item => item._id.toString());
                    return ids.length === new Set(ids).size;
                },
                message: 'Duplicate items are not allowed in a combo'
            }
        ]
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative'],
        max: [1000000, 'Total price cannot exceed ₦1,000,000'], // Reasonable limit
        validate: {
            validator: function (v: number) {
                // Ensure price has at most 2 decimal places
                return /^\d+(\.\d{1,2})?$/.test(v.toString());
            },
            message: 'Price must have at most 2 decimal places'
        }
    },
    imageUrl: {
        type: String,
        required: [true, 'Image URL is required'],
        validate: [
            {
                validator: function (v: string) {
                    try {
                        new URL(v);
                        return true;
                    } catch {
                        return false;
                    }
                },
                message: 'Invalid URL format'
            },
            {
                validator: function (v: string) {
                    return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(v);
                },
                message: 'Image URL must end with .jpg, .jpeg, .png, .gif, or .webp'
            },
            {
                validator: function (v: string) {
                    return v.length <= 2000; // Reasonable URL length limit
                },
                message: 'Image URL is too long'
            }
        ]
    },
    available: {
        type: Boolean,
        default: true,
        index: true,
    },
    featured: {
        type: Boolean,
        default: false,
        index: true,
    },
    // Additional metadata
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    nutritionalInfo: {
        calories: {
            type: Number,
            min: 0,
            max: 10000
        },
        protein: {
            type: Number,
            min: 0,
            max: 1000
        },
        carbs: {
            type: Number,
            min: 0,
            max: 1000
        },
        fat: {
            type: Number,
            min: 0,
            max: 1000
        }
    },
    allergens: [{
        type: String,
        enum: ['nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish', 'fish', 'sesame'],
    }],
    // Tracking fields
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    orderCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // SEO and metadata
    slug: {
        type: String,
        unique: true,
        sparse: true, // Allow null values
        index: true
    },
    metaDescription: {
        type: String,
        maxlength: [160, 'Meta description cannot exceed 160 characters']
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        // transform: function (doc, ret) {
        //     // if ('__v' in ret) {
        //     //     delete ret.__v;
        //     // }
        //     return ret;
        // }
    },
    toObject: { virtuals: true }
});

// Indexes for better query performance
SpecialComboSchema.index({ available: 1, featured: 1 });
SpecialComboSchema.index({ createdAt: -1 });
SpecialComboSchema.index({ name: 'text', description: 'text' });
SpecialComboSchema.index({ totalPrice: 1 });
SpecialComboSchema.index({ 'items._id': 1 }); 

// Virtual fields
SpecialComboSchema.virtual('itemCount').get(function () {
    return this.items?.length || 0;
});

SpecialComboSchema.virtual('totalQuantity').get(function () {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
});

SpecialComboSchema.virtual('isPopular').get(function () {
    return (this.orderCount || 0) >= 10; // Consider popular if ordered 10+ times
});

SpecialComboSchema.virtual('discountPercentage').get(function () {
    // This would require calculating based on individual item prices
    // For now, returning 0 as a placeholder
    return 0;
});

// Enhanced pre-save middleware
SpecialComboSchema.pre('save', async function (next) {
    try {
        // Generate slug from name if not provided
        if (!this.slug && this.name) {
            const baseSlug = this.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            // Ensure slug uniqueness
            let slug = baseSlug;
            let counter = 1;

            while (await mongoose.models.SpecialCombo?.findOne({ slug, _id: { $ne: this._id } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            this.slug = slug;
        }


        // Ensure featured combos are available
        if (this.featured && !this.available) {
            this.featured = false;
        }

        if (!this.metaDescription && this.description) {
            this.metaDescription = this.description.length > 160
                ? this.description.substring(0, 157) + '...'
                : this.description;
        }

        next();
    } catch (error) {
        next(error as Error);
    }
});

SpecialComboSchema.post('save', function (doc) {
    console.log(`✅ Special combo saved: ${doc.name} (ID: ${doc._id})`);

});

SpecialComboSchema.post('findOneAndDelete', function (doc) {
    if (doc) {
        console.log(`🗑️ Special combo deleted: ${doc.name} (ID: ${doc._id})`);
    }
});

SpecialComboSchema.methods.incrementView = async function () {
    this.viewCount = (this.viewCount || 0) + 1;
    return this.save();
};

SpecialComboSchema.methods.incrementOrder = async function () {
    this.orderCount = (this.orderCount || 0) + 1;
    return this.save();
};

SpecialComboSchema.methods.setAvailability = async function (available: boolean) {
    this.available = available;
    if (!available) {
        this.featured = false;
    }
    return this.save();
};

SpecialComboSchema.methods.toPublicJSON = function () {
    const obj = this.toObject();
    delete obj.viewCount;
    delete obj.orderCount;
    return obj;
};

SpecialComboSchema.statics.findFeatured = function (limit = 10) {
    return this.find({
        available: true,
        featured: true
    })
        .populate({
            path: 'items._id',
            select: 'name price category available',
            match: { available: true }
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

SpecialComboSchema.statics.findAvailable = function (limit = 50) {
    return this.find({ available: true })
        .populate({
            path: 'items._id',
            select: 'name price category available'
        })
        .sort({ featured: -1, createdAt: -1 })
        .limit(limit)
        .lean();
};

SpecialComboSchema.statics.searchCombos = function (query: string, limit = 20) {
    return this.find({
        $and: [
            { available: true },
            {
                $or: [
                    { $text: { $search: query } },
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { tags: { $in: [new RegExp(query, 'i')] } }
                ]
            }
        ]
    })
        .populate({
            path: 'items._id',
            select: 'name price category'
        })
        .sort({ score: { $meta: 'textScore' }, featured: -1 })
        .limit(limit)
        .lean();
};

SpecialComboSchema.statics.getPopular = function (limit = 10) {
    return this.find({ available: true })
        .populate({
            path: 'items._id',
            select: 'name price category'
        })
        .sort({ orderCount: -1, viewCount: -1 })
        .limit(limit)
        .lean();
};

const SpecialCombo: Model<ISpecialCombo> = mongoose.models.SpecialCombo ||
    mongoose.model<ISpecialCombo>('SpecialCombo', SpecialComboSchema);

export default SpecialCombo;
