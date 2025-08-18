/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MenuItem from '@/models/MenuItem';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';

const IdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// validation schema for menu item updates
const UpdateMenuItemSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters").optional(),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
    price: z.number().min(0.01, "Price must be positive").optional(),
    category: z.string().min(1, "Category is required").optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    images: z.array(z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        isPrimary: z.boolean().optional()
    })).optional(),
    addOns: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number().min(0),
        category: z.string().optional()
    })).optional(),
    popular: z.boolean().optional(),
    vegetarian: z.boolean().optional(),
    vegan: z.boolean().optional(),
    glutenFree: z.boolean().optional(),
    prepTime: z.number().min(1).max(120).optional(),
    allergens: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    nutrition: z.object({
        calories: z.number().min(0).optional(),
        protein: z.number().min(0).optional(),
        carbs: z.number().min(0).optional(),
        fat: z.number().min(0).optional()
    }).optional()
});

// GET a single menu item
export const GET = withRateLimit(async (
    request: Request,
    context: { params: Promise<{ id: string }> }
) => {
    await connectDB();

    try {
        const { id } = await context.params;
        const parsedId = IdSchema.safeParse(id);

        if (!parsedId.success) {
            return NextResponse.json(
                { message: 'Invalid ID', errors: parsedId.error.format() },
                { status: 400 }
            );
        }

        const menuItem = await MenuItem.findById(parsedId.data).lean();

        if (!menuItem) {
            return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
        }

        const response = NextResponse.json(menuItem);
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
        return response;
    } catch (error: any) {
        console.error('Error fetching menu item:', error);
        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
});

// UPDATE a menu item
export const PATCH = withRateLimit(async (
    request: Request,
    context: { params: Promise<{ id: string }> }
) => {
    await connectDB();

    try {
        const { id } = await context.params;
        const parsedId = IdSchema.safeParse(id);

        if (!parsedId.success) {
            return NextResponse.json(
                { message: 'Invalid ID', errors: parsedId.error.format() },
                { status: 400 }
            );
        }

        const body = await request.json();
        console.log('Received update data:', body);

        // Validate the request body
        const validationResult = UpdateMenuItemSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    message: 'Validation failed',
                    errors: validationResult.error.format()
                },
                { status: 400 }
            );
        }

        const updateData = validationResult.data;

        // Handle image processing
        if (updateData.images && updateData.images.length > 0) {
            // Ensure only one primary image
            const primaryImages = updateData.images.filter(img => img.isPrimary);

            if (primaryImages.length === 0) {
                // Set first image as primary if none specified
                updateData.images[0].isPrimary = true;
            } else if (primaryImages.length > 1) {
                // If multiple primaries, keep only the first one
                updateData.images = updateData.images.map((img, index) => ({
                    ...img,
                    isPrimary: index === 0 && img.isPrimary
                }));
            }

            // Set imageUrl to the primary image
            const primaryImage = updateData.images.find(img => img.isPrimary);
            if (primaryImage) {
                updateData.imageUrl = primaryImage.url;
            }
        }

        // Handle add-ons validation
        if (updateData.addOns) {
            for (const addOn of updateData.addOns) {
                if (!addOn.id || !addOn.name || addOn.price < 0) {
                    return NextResponse.json(
                        { message: 'Invalid add-on data' },
                        { status: 400 }
                    );
                }
            }
        }

        console.log('Processed update data:', updateData);

        // Update and return the updated document
        const updatedMenuItem = await MenuItem.findByIdAndUpdate(
            parsedId.data,
            {
                ...updateData,
                updatedAt: new Date()
            },
            {
                new: true,
                runValidators: true,
                lean: false // Get full mongoose document for virtuals
            }
        );

        if (!updatedMenuItem) {
            return NextResponse.json(
                { message: 'Menu item not found' },
                { status: 404 }
            );
        }

        console.log('Updated menu item:', {
            id: updatedMenuItem._id,
            name: updatedMenuItem.name,
            imageUrl: updatedMenuItem.imageUrl,
            imagesCount: updatedMenuItem.images?.length || 0
        });

        return NextResponse.json(updatedMenuItem);
    } catch (error: any) {
        console.error('Error updating menu item:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors: any = {};
            for (const field in error.errors) {
                validationErrors[field] = error.errors[field].message;
            }
            return NextResponse.json(
                { message: 'Validation error', errors: validationErrors },
                { status: 400 }
            );
        }

        // Handle cast errors (invalid ObjectId, etc.)
        if (error.name === 'CastError') {
            return NextResponse.json(
                { message: 'Invalid data format' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
});

// DELETE a menu item
export const DELETE = withRateLimit(async (
    request: Request,
    context: { params: Promise<{ id: string }> }
) => {
    await connectDB();

    try {
        const { id } = await context.params;
        const parsedId = IdSchema.safeParse(id);

        if (!parsedId.success) {
            return NextResponse.json(
                { message: 'Invalid ID', errors: parsedId.error.format() },
                { status: 400 }
            );
        }

        // Soft delete by setting deletedAt timestamp
        const deletedMenuItem = await MenuItem.findByIdAndUpdate(
            parsedId.data,
            {
                deletedAt: new Date(),
                available: false
            },
            { new: true }
        );

        if (!deletedMenuItem) {
            return NextResponse.json(
                { message: 'Menu item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Menu item deleted successfully',
            deletedItem: {
                id: deletedMenuItem._id,
                name: deletedMenuItem.name
            }
        });
    } catch (error: any) {
        console.error('Error deleting menu item:', error);
        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
});
