/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SpecialCombo from '@/models/SpecialCombo';
import { withRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import mongoose from 'mongoose';
import MenuItem from '@/models/MenuItem';

const CreateComboSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    description: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
    items: z.array(
        z.object({
            _id: z.string().min(1, 'Menu item ID is required'),
            quantity: z.number().min(1, 'Quantity must be at least 1'),
        })
    ).min(1, 'A combo must have at least one item'),
    totalPrice: z.number().min(0, 'Total price must be non-negative'),
    imageUrl: z.string().url('Invalid image URL').regex(/\.jpg$|\.jpeg$|\.png$|\.gif$|\.webp$/i, 'Image URL must end with .jpg, .jpeg, .png, .gif, or .webp'),
    available: z.boolean().optional().default(true),
    featured: z.boolean().optional().default(false),
});

//  GET handler with better error handling and fallback strategies
export const GET = withRateLimit(async (request: Request) => {
    try {
        console.log('🚀 Starting GET /api/special-combo request');

        // Ensure database connection
        await connectDB();
        console.log('✅ Database connected successfully');

        // Check if the model is properly registered
        if (!mongoose.models.SpecialCombo) {
            console.warn('⚠️ SpecialCombo model not found in mongoose.models');
        }

        // Parse URL to get query parameters
        const url = new URL(request.url);
        const featuredOnly = url.searchParams.get('featured') === 'true';
        const availableOnly = url.searchParams.get('available') !== 'false'; // Default to true
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const skip = parseInt(url.searchParams.get('skip') || '0');

        console.log('🔍 Query parameters:', { featuredOnly, availableOnly, limit, skip });

        // Build query with fallback strategy
        let query: any = {};

        if (availableOnly) {
            query.available = true;
        }

        if (featuredOnly) {
            query.featured = true;
        }

        console.log('📝 MongoDB query:', query);

        // Try to fetch combos with population
        interface ComboItem {
            _id: string;
            quantity: number;
        }

        interface PopulatedComboItem {
            _id: {
            _id?: string;
            name?: string;
            price?: number;
            category?: string;
            } | string;
            quantity: number;
        }

        interface SpecialComboType {
            _id: string;
            name: string;
            description: string;
            items: PopulatedComboItem[];
            totalPrice: number;
            imageUrl: string;
            available: boolean;
            featured: boolean;
            createdAt?: Date;
            updatedAt?: Date;
        }

        let combos: SpecialComboType[] | any[];
        try {
            combos = await SpecialCombo.find(query)
                .populate({
                    path: 'items._id',
                    select: 'name price category',
                    options: { strictPopulate: false }
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean()
                .exec();

            
        } catch (populateError) {
            console.warn('⚠️ Population failed, trying without populate:', populateError);

            // Fallback: fetch without population
            combos = await SpecialCombo.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean()
                .exec();

            
        }

        // If no featured combos found, try fetching all available combos as fallback
        if ((!combos || combos.length === 0) && featuredOnly) {
            console.log('🔄 No featured combos found, trying all available combos');

            try {
                combos = await SpecialCombo.find({ available: true })
                    .populate({
                        path: 'items._id',
                        select: 'name price category',
                        options: { strictPopulate: false }
                    })
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .skip(skip)
                    .lean()
                    .exec();

                
            } catch (fallbackError) {
                console.warn('⚠️ Fallback also failed:', fallbackError);
                combos = [];
            }
        }

        
        const combosWithNames = (combos || []).map(combo => {
            try {
                interface ComboItem {
                    _id: {
                        _id?: string;
                        name?: string;
                        price?: number;
                        category?: string;
                    } | string;
                    quantity: number;
                }

                interface EnhancedComboItem {
                    _id: string;
                    name: string;
                    quantity: number;
                    price?: number;
                    category?: string;
                }

                const comboItems: EnhancedComboItem[] = (combo.items as ComboItem[]).map((item: ComboItem) => {
                    
                    if (typeof item._id === 'string') {
                        return {
                            _id: item._id,
                            name: 'Unknown Item', // Fallback name
                            quantity: item.quantity,
                        };
                    } else if (item._id && typeof item._id === 'object') {
                        return {
                            _id: item._id._id || 'unknown',
                            name: item._id.name || 'Unknown Item',
                            quantity: item.quantity,
                            price: item._id.price,
                            category: item._id.category,
                        };
                    } else {
                        return {
                            _id: 'unknown',
                            name: 'Unknown Item',
                            quantity: item.quantity,
                        };
                    }
                });

                return {
                    ...combo,
                    items: comboItems,
                };
            } catch (transformError) {
                console.error('❌ Error transforming combo:', combo._id, transformError);
                return combo; // Return original if transformation fails
            }
        });

        // Count total for pagination
        const total = await SpecialCombo.countDocuments(query);

        const response = NextResponse.json({
            success: true,
            data: combosWithNames,
            meta: {
                total,
                count: combosWithNames.length,
                skip,
                limit,
                hasMore: skip + combosWithNames.length < total
            },
            message: combosWithNames.length > 0
                ? ''
                : 'No special combos found matching criteria'
        }, { status: 200 });

        // Enhanced caching headers
        response.headers.set('Cache-Control', 'public, max-age=180, s-maxage=300, stale-while-revalidate=600');
        response.headers.set('Vary', 'Accept, Authorization');

        return response;

    } catch (error) {
        console.error('❌ API Error in GET /api/special-combo:', error);

        // Enhanced error response with more details in development
        const isDev = process.env.NODE_ENV === 'development';

        return NextResponse.json({
            success: false,
            message: 'Internal server error',
            ...(isDev && {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            })
        }, { status: 500 });
    }
});

//  POST handler with better validation and error handling
export const POST = withRateLimit(async (request: Request) => {
    try {
        console.log('🚀 Starting POST /api/special-combo request');

        await connectDB();
        console.log('✅ Database connected successfully');

        const body = await request.json();
        console.log('📝 Request body received:', { ...body, imageUrl: body.imageUrl ? '[REDACTED]' : undefined });

        const validatedData = CreateComboSchema.safeParse(body);

        if (!validatedData.success) {
            console.warn('❌ Validation failed:', validatedData.error.format());
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid input data',
                    errors: validatedData.error.format(),
                    details: validatedData.error.issues
                },
                { status: 400 }
            );
        }

        const { name, description, items, totalPrice, imageUrl, available, featured } = validatedData.data;

        // Enhanced validation: Check if referenced menu items exist
        const menuItemIds = items.map(item => {
            try {
                return new mongoose.Types.ObjectId(item._id);
            } catch (error) {
                throw new Error(`Invalid menu item ID: ${item._id}`);
            }
        });

        // Optional: Verify menu items exist (uncomment if you have a MenuItem model)
        
        const existingMenuItems = await MenuItem.find({ 
            _id: { $in: menuItemIds },
            available: true 
        }).select('_id name price');
        
        if (existingMenuItems.length !== menuItemIds.length) {
            const foundIds = existingMenuItems.map(item => item._id.toString());
            const missingIds = items
                .map(item => item._id)
                .filter(id => !foundIds.includes(id));
                
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Some menu items not found or unavailable',
                    missingItems: missingIds
                },
                { status: 400 }
            );
        }
        console.log('✅ All menu items validated successfully');

        // Check for duplicate combo name
        const existingCombo = await SpecialCombo.findOne({ name: name.trim() });
        if (existingCombo) {
            return NextResponse.json(
                { success: false, message: 'A combo with this name already exists' },
                { status: 409 }
            );
        }

        const newCombo = new SpecialCombo({
            name: name.trim(),
            description: description.trim(),
            items: items.map(item => ({
                _id: new mongoose.Types.ObjectId(item._id),
                quantity: item.quantity
            })),
            totalPrice,
            imageUrl,
            available: available ?? true,
            featured: featured ?? false,
        });

        await newCombo.save();
        console.log('✅ New combo created with ID:', newCombo._id);

        // Populate the response with menu item details
        const populatedCombo = await SpecialCombo.findById(newCombo._id)
            .populate({
                path: 'items._id',
                select: 'name price category'
            })
            .lean();

        return NextResponse.json(
            {
                success: true,
                data: populatedCombo || newCombo,
                message: 'Special combo created successfully'
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('❌ API Error in POST /api/special-combo:', error);

        // Handle specific MongoDB errors
        if (error instanceof Error) {
            if (error.message.includes('E11000')) {
                return NextResponse.json(
                    { success: false, message: 'A combo with this name already exists' },
                    { status: 409 }
                );
            }

            if (error.message.includes('validation failed')) {
                return NextResponse.json(
                    { success: false, message: 'Data validation failed', error: error.message },
                    { status: 400 }
                );
            }
        }

        const isDev = process.env.NODE_ENV === 'development';

        return NextResponse.json({
            success: false,
            message: 'Internal server error',
            ...(isDev && {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            })
        }, { status: 500 });
    }
});


export const PUT = withRateLimit(async (request: Request) => {
    try {
        await connectDB();

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Combo ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const validatedData = CreateComboSchema.partial().safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { success: false, message: 'Invalid input data', errors: validatedData.error.format() },
                { status: 400 }
            );
        }

        const updatedCombo = await SpecialCombo.findByIdAndUpdate(
            id,
            { ...validatedData.data, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate({
            path: 'items._id',
            select: 'name price category'
        });

        if (!updatedCombo) {
            return NextResponse.json(
                { success: false, message: 'Combo not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, data: updatedCombo, message: 'Combo updated successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('❌ API Error in PUT /api/special-combo:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
});

export const DELETE = withRateLimit(async (request: Request) => {
    try {
        await connectDB();

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Combo ID is required' },
                { status: 400 }
            );
        }

        const deletedCombo = await SpecialCombo.findByIdAndDelete(id);

        if (!deletedCombo) {
            return NextResponse.json(
                { success: false, message: 'Combo not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Combo deleted successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('❌ API Error in DELETE /api/special-combo:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
});
