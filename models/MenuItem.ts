/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document } from 'mongoose';

// AddOn schema with more features
const AddOnSchema = new Schema({
    id: {
        type: String,
        required: [true, 'Add-on ID is required'],
        unique: true, // Ensure uniqueness within the array
        trim: true,
        default: () => crypto.randomUUID(), 
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    price: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: (v: number) => v >= 0,
            message: 'Add-on price must be non-negative'
        }
    },
    category: {
        type: String,
        enum: ['extra', 'sauce', 'side', 'drink', 'dessert'],
        default: 'extra'
    },
    available: {
        type: Boolean,
        default: true
    },
    maxQuantity: {
        type: Number,
        default: 5,
        min: 1
    }
}, {
    _id: false
});

const ImageSchema = new Schema({
    url: {
        type: String,
        required: true,
        validate: {
            validator: (v: string) => {
                if (!v) return false;
                try {
                    new URL(v);
                    return /\.(jpg|jpeg|png|gif|webp)$/i.test(v);
                } catch {
                    return false;
                }
            },
            message: 'Invalid image URL format'
        }
    },
    alt: {
        type: String,
        default: '',
        maxlength: 200
    },
    isPrimary: {
        type: Boolean,
        default: false
    }
}, { _id: false });


const MenuItemSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
        index: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true,
        sparse: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [100, 'Short description cannot exceed 100 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price must be positive'],
        validate: {
            validator: (v: number) => v > 0,
            message: 'Price must be greater than 0'
        }
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        lowercase: true,
        maxlength: [50, 'Category name too long'],
        index: true
    },
    subcategory: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Subcategory name too long']
    },
    imageUrl: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                try {
                    new URL(v);
                    return /\.(jpg|jpeg|png|gif|webp)$/i.test(v);
                } catch {
                    return false;
                }
            },
            message: 'Invalid image URL format'
        }
    },
    images: {
        type: [ImageSchema],
        validate: {
            validator: function (images: any[]) {
                if (!images || images.length === 0) return true;

                // Check maximum of 5 images
                if (images.length > 5) return false;

                // Check that only one image is marked as primary
                const primaryCount = images.filter(img => img.isPrimary).length;
                return primaryCount <= 1;
            },
            message: 'Maximum 5 images allowed and only one can be primary'
        }
    },
    oldPrice: {
        type: Number,
        min: [0, 'Old price must be positive'],
        validate: {
            validator: function (this: any, v: number) {
                if (v === undefined || v === null) return true;
                return v > this.price; // Old price should be higher than current price
            },
            message: 'Old price must be higher than current price'
        }
    },
    addOns: [AddOnSchema],

    // Status and availability
    available: {
        type: Boolean,
        default: true,
        index: true
    },
    popular: {
        type: Boolean,
        default: false,
        index: true
    },
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    spicy: {
        type: Boolean,
        default: false
    },
    vegetarian: {
        type: Boolean,
        default: false,
        index: true
    },
    vegan: {
        type: Boolean,
        default: false,
        index: true
    },
    glutenFree: {
        type: Boolean,
        default: false,
        index: true
    },

    // Nutritional information
    nutrition: {
        calories: { type: Number, min: 0 },
        protein: { type: Number, min: 0 }, // in grams
        carbs: { type: Number, min: 0 }, // in grams
        fat: { type: Number, min: 0 }, // in grams
        fiber: { type: Number, min: 0 }, // in grams
        sugar: { type: Number, min: 0 }, // in grams
        sodium: { type: Number, min: 0 }, // in mg
    },

    // Additional details
    prepTime: {
        type: Number,
        min: 1,
        max: 120 // max 2 hours
    }, // in minutes
    servingSize: {
        type: String,
        maxlength: 50
    },
    allergens: [{
        type: String,
        enum: [
            'dairy', 'eggs', 'fish', 'shellfish', 'tree_nuts',
            'peanuts', 'wheat', 'soybeans', 'sesame'
        ]
    }],
    ingredients: [{
        type: String,
        trim: true,
        maxlength: 100
    }],

    // Business metrics
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    orderCount: {
        type: Number,
        default: 0,
        min: 0
    },
    rating: {
        average: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        count: {
            type: Number,
            min: 0,
            default: 0
        }
    },

    // Inventory and stock
    stock: {
        quantity: {
            type: Number,
            min: 0,
            default: null // null means unlimited stock
        },
        lowStockThreshold: {
            type: Number,
            min: 0,
            default: 5
        },
        trackStock: {
            type: Boolean,
            default: false
        }
    },

    // SEO and marketing
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 30
    }],
    metaDescription: {
        type: String,
        maxlength: 160
    },

    // Scheduling and availability
    availableFrom: {
        type: Date
    },
    availableUntil: {
        type: Date
    },
    dayAvailability: {
        monday: { type: Boolean, default: true },
        tuesday: { type: Boolean, default: true },
        wednesday: { type: Boolean, default: true },
        thursday: { type: Boolean, default: true },
        friday: { type: Boolean, default: true },
        saturday: { type: Boolean, default: true },
        sunday: { type: Boolean, default: true }
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },

    // Soft delete
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            const { __v, deletedAt, ...rest } = ret;
            return rest;
        }
    },
    toObject: { virtuals: true }
});

MenuItemSchema.index({ category: 1, available: 1 });
MenuItemSchema.index({ popular: 1, available: 1 });
MenuItemSchema.index({ featured: 1, available: 1 });
MenuItemSchema.index({ price: 1 });
MenuItemSchema.index({ createdAt: -1 });
MenuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });
MenuItemSchema.index({ 'rating.average': -1 });
MenuItemSchema.index({ orderCount: -1 });
MenuItemSchema.index({ deletedAt: 1 });

MenuItemSchema.virtual('discountPercentage').get(function (this: any) {
    if (!this.oldPrice || this.oldPrice <= this.price) return 0;
    return Math.round(((this.oldPrice - this.price) / this.oldPrice) * 100);
});

MenuItemSchema.virtual('savings').get(function (this: any) {
    if (!this.oldPrice || this.oldPrice <= this.price) return 0;
    return this.oldPrice - this.price;
});

MenuItemSchema.virtual('isOnSale').get(function (this: any) {
    return this.oldPrice && this.oldPrice > this.price;
});

MenuItemSchema.virtual('isLowStock').get(function (this: any) {
    if (!this.stock?.trackStock) return false;
    return this.stock.quantity !== null &&
        this.stock.quantity <= this.stock.lowStockThreshold;
});

MenuItemSchema.virtual('isOutOfStock').get(function (this: any) {
    if (!this.stock?.trackStock) return false;
    return this.stock.quantity !== null && this.stock.quantity <= 0;
});

MenuItemSchema.virtual('averageRating').get(function (this: any) {
    return this.rating?.average || 0;
});

MenuItemSchema.virtual('primaryImage').get(function (this: any) {
    if (this.images && this.images.length > 0) {
        return this.images.find((img: any) => img.isPrimary) || this.images[0];
    }
    return null;
});

MenuItemSchema.pre('save', function (this: any, next) {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    if (!this.shortDescription && this.description) {
        this.shortDescription = this.description.substring(0, 100);
        if (this.description.length > 100) {
            this.shortDescription += '...';
        }
    }

    if (this.images && this.images.length > 0) {
        const primaryImages = this.images.filter((img: any) => img.isPrimary);

        if (primaryImages.length === 0) {
            this.images[0].isPrimary = true;
        } else if (primaryImages.length > 1) {
            this.images.forEach((img: any, index: number) => {
                img.isPrimary = index === 0 && img.isPrimary;
            });
        }

        const primaryImage = this.images.find((img: any) => img.isPrimary);
        this.imageUrl = primaryImage?.url || this.images[0].url;
    } else {
        this.imageUrl = undefined; // no images
    }

    if (this.addOns && this.addOns.length > 0) {
        const seenIds = new Set();
        this.addOns = this.addOns.filter((addOn: any) => {
            if (seenIds.has(addOn.id)) {
                return false;
            }
            seenIds.add(addOn.id);
            return true;
        });
    }

    this.updatedAt = new Date();

    next();
});

MenuItemSchema.statics.findAvailable = function (this: mongoose.Model<IMenuItem>) {
    return this.find({
        available: true,
        deletedAt: null,
        $and: [
            {
                $or: [
                    { availableFrom: { $exists: false } },
                    { availableFrom: { $lte: new Date() } }
                ]
            },
            {
                $or: [
                    { availableUntil: { $exists: false } },
                    { availableUntil: { $gte: new Date() } }
                ]
            }
        ]
    });
};

MenuItemSchema.statics.findPopular = function (this: mongoose.Model<IMenuItem>) {
    return (this as any).findAvailable().where({ popular: true });
};

MenuItemSchema.statics.findFeatured = function (this: mongoose.Model<IMenuItem>) {
    return (this as any).findAvailable().where({ featured: true });
};

MenuItemSchema.statics.findByCategory = function (this: mongoose.Model<IMenuItem>, category: string) {
    return (this as any).findAvailable().where({ category: category.toLowerCase() });
};

MenuItemSchema.statics.searchItems = function (this: mongoose.Model<IMenuItem>, query: string) {
    return (this as any).findAvailable().find({
        $text: { $search: query }
    }).select({ score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
};

// Instance methods
MenuItemSchema.methods.incrementViews = function () {
    this.views = (this.views || 0) + 1;
    return this.save();
};

MenuItemSchema.methods.incrementOrders = function () {
    this.orderCount = (this.orderCount || 0) + 1;
    return this.save();
};

MenuItemSchema.methods.updateRating = function (newRating: number) {
    const currentAverage = this.rating?.average || 0;
    const currentCount = this.rating?.count || 0;

    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + newRating) / newCount;

    this.rating = {
        average: Math.round(newAverage * 10) / 10,
        count: newCount
    };

    return this.save();
};

MenuItemSchema.methods.adjustStock = function (quantity: number) {
    if (!this.stock?.trackStock) return this;

    if (this.stock.quantity !== null) {
        this.stock.quantity = Math.max(0, this.stock.quantity + quantity);
    }

    return this.save();
};

export interface IMenuItem extends Document {
    name: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    price: number;
    category: string;
    subcategory?: string;
    imageUrl?: string;
    images?: Array<{
        url: string;
        alt?: string;
        isPrimary?: boolean;
    }>;
    oldPrice?: number;
    addOns?: Array<{
        id: string;
        name: string;
        price: number;
        category?: string;
        available?: boolean;
        maxQuantity?: number;
    }>;
    available: boolean;
    popular: boolean;
    featured: boolean;
    spicy?: boolean;
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    nutrition?: {
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        fiber?: number;
        sugar?: number;
        sodium?: number;
    };
    prepTime?: number;
    servingSize?: string;
    allergens?: string[];
    ingredients?: string[];
    views: number;
    orderCount: number;
    rating?: {
        average: number;
        count: number;
    };
    stock?: {
        quantity?: number;
        lowStockThreshold?: number;
        trackStock?: boolean;
    };
    tags?: string[];
    metaDescription?: string;
    availableFrom?: Date;
    availableUntil?: Date;
    dayAvailability?: {
        [key: string]: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;

    // Virtual fields
    discountPercentage: number;
    savings: number;
    isOnSale: boolean;
    isLowStock: boolean;
    isOutOfStock: boolean;
    averageRating: number;

    // Methods
    incrementViews(): Promise<IMenuItem>;
    incrementOrders(): Promise<IMenuItem>;
    updateRating(rating: number): Promise<IMenuItem>;
    adjustStock(quantity: number): Promise<IMenuItem>;
}

export default mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
