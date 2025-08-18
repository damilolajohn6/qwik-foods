/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MenuItem from '@/models/MenuItem';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';

const IdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

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

        // Update and return the updated document
        const updatedMenuItem = await MenuItem.findByIdAndUpdate(
            parsedId.data,
            { ...body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedMenuItem) {
            return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
        }

        return NextResponse.json(updatedMenuItem);
    } catch (error: any) {
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

        const deletedMenuItem = await MenuItem.findByIdAndDelete(parsedId.data);

        if (!deletedMenuItem) {
            return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Menu item deleted successfully' });
    } catch (error: any) {
        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
});
