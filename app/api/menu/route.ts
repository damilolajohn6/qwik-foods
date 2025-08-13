/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MenuItem from '@/models/MenuItem';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';

const MenuItemSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    description: z.string().max(500, 'Description is too long').optional(),
    price: z.number().positive('Price must be positive'),
    category: z.string().min(1, 'Category is required').max(50, 'Category is too long'),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
    oldPrice: z.number().positive('Old price must be positive').optional(),
    addOns: z
        .array(
            z.object({
                id: z.string().min(1, 'Add-on ID is required'),
                name: z.string().min(1, 'Add-on name is required').max(50),
                price: z.number().positive('Add-on price must be positive'),
            })
        )
        .optional(),
});

const QuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    category: z.string().optional().transform((val) => val?.toLowerCase() || 'all'), // Normalize to lowercase
    search: z.string().optional().transform((val) => val || ''), // Ensure empty string
    sort: z.enum(['low-to-high', 'high-to-low', 'a-z']).default('low-to-high'),
});

export const GET = withRateLimit(async (request: Request) => {
    await connectDB();

    try {
        const { searchParams } = new URL(request.url);
        const query = QuerySchema.safeParse({
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
            category: searchParams.get('category'),
            search: searchParams.get('search'),
            sort: searchParams.get('sort'),
        });

        if (!query.success) {
            return NextResponse.json(
                { message: 'Invalid query parameters', errors: query.error.format() },
                { status: 400 }
            );
        }

        const { page, limit, category, search, sort } = query.data;

        const filter: any = {};
        if (category !== 'all') {
            filter.category = category;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        if (searchParams.get("popular") === "true") {
            filter.popular = true;
        }

        const sortOption: any = {};
        switch (sort) {
            case 'low-to-high':
                sortOption.price = 1;
                break;
            case 'high-to-low':
                sortOption.price = -1;
                break;
            case 'a-z':
                sortOption.name = 1;
                break;
        }

        const menuItems = await MenuItem.find(filter)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await MenuItem.countDocuments(filter);

        const response = NextResponse.json({
            data: menuItems,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });

        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
        return response;
    } catch (error: any) {
        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
});

export const POST = withRateLimit(async (request: Request) => {
    await connectDB();

    try {
        const data = await request.json();
        const parsedData = MenuItemSchema.safeParse(data);

        if (!parsedData.success) {
            return NextResponse.json(
                { message: 'Invalid input data', errors: parsedData.error.format() },
                { status: 400 }
            );
        }

        const menuItem = new MenuItem(parsedData.data);
        await menuItem.save();

        return NextResponse.json(menuItem, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
});
