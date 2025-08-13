/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MenuItem from '@/models/MenuItem';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';

const IdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

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
})