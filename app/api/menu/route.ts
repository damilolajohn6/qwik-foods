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
    popular: z.boolean().default(false),
});

const QuerySchema = z.object({
    page: z.preprocess(
        (val) => val === null || val === undefined ? 1 : parseInt(val as string, 10),
        z.number().int().positive().default(1)
    ),
    limit: z.preprocess(
        (val) => val === null || val === undefined ? 10 : parseInt(val as string, 10),
        z.number().int().positive().max(100).default(10)
    ),
    category: z.preprocess(
        (val) => val === null || val === undefined || val === '' ? 'all' : (val as string).toLowerCase(),
        z.string().default('all')
    ),
    search: z.preprocess(
        (val) => val === null || val === undefined ? '' : val,
        z.string().default('')
    ),
    sort: z.enum(['low-to-high', 'high-to-low', 'a-z', 'z-a', 'newest', 'oldest']).default('low-to-high'),
    popular: z.preprocess(
        (val) => {
            if (val === null || val === undefined || val === '') return undefined;
            if (typeof val === 'string') {
                return val.toLowerCase() === 'true';
            }
            return Boolean(val);
        },
        z.boolean().optional()
    ),
    minPrice: z.preprocess(
        (val) => val === null || val === undefined || val === '' ? undefined : parseFloat(val as string),
        z.number().positive().optional()
    ),
    maxPrice: z.preprocess(
        (val) => val === null || val === undefined || val === '' ? undefined : parseFloat(val as string),
        z.number().positive().optional()
    ),
    featured: z.preprocess(
        (val) => {
            if (val === null || val === undefined || val === '') return undefined;
            if (typeof val === 'string') {
                return val.toLowerCase() === 'true';
            }
            return Boolean(val);
        },
        z.boolean().optional()
    ),
});

export const GET = withRateLimit(async (request: Request) => {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        const queryParams = Object.fromEntries(searchParams.entries());

        const parseResult = QuerySchema.safeParse(queryParams);

        if (!parseResult.success) {
            console.error('Query validation errors:', parseResult.error.format());
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid query parameters',
                    errors: parseResult.error.format(),
                    receivedParams: queryParams
                },
                { status: 400 }
            );
        }

        const { page, limit, category, search, sort, popular, minPrice, maxPrice, featured } = parseResult.data;

        const filter: any = {};

        if (category && category !== 'all') {
            filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { name: { $regex: searchRegex } },
                { description: { $regex: searchRegex } },
                { category: { $regex: searchRegex } },
            ];
        }

        if (popular === true) {
            filter.popular = true;
        }

        if (featured === true) {
            filter.featured = true;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = minPrice;
            if (maxPrice !== undefined) filter.price.$lte = maxPrice;
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
            case 'z-a':
                sortOption.name = -1;
                break;
            case 'newest':
                sortOption.createdAt = -1;
                break;
            case 'oldest':
                sortOption.createdAt = 1;
                break;
            default:
                sortOption.price = 1;
        }

        if (!sortOption.createdAt) {
            sortOption.createdAt = -1;
        }

        console.log('Query filters:', { filter, sortOption, page, limit });

        const [menuItems, total, categories] = await Promise.all([
            MenuItem.find(filter)
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .exec(),
            MenuItem.countDocuments(filter).exec(),
            MenuItem.distinct('category').exec()
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const response = NextResponse.json({
            success: true,
            data: menuItems,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null,
            },
            meta: {
                categories: categories.sort(),
                filters: {
                    category: category !== 'all' ? category : null,
                    search: search || null,
                    popular,
                    featured,
                    minPrice,
                    maxPrice,
                    sort
                }
            }
        });

        const cacheControl = popular || featured ?
            'public, max-age=300, s-maxage=300, stale-while-revalidate=600' : // 5 min cache for popular/featured
            'public, max-age=60, s-maxage=60, stale-while-revalidate=300';    // 1 min cache for regular queries

        response.headers.set('Cache-Control', cacheControl);
        response.headers.set('X-Total-Count', total.toString());

        return response;
    } catch (error: any) {
        console.error('API Error:', error);

        if (error.name === 'CastError') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid query format',
                    error: 'One or more query parameters have invalid format'
                },
                { status: 400 }
            );
        }

        if (error.name === 'MongoNetworkError') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Database connection error',
                    error: 'Unable to connect to database'
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            },
            { status: 500 }
        );
    }
});

export const POST = withRateLimit(async (request: Request) => {
    try {
        await connectDB();

        const data = await request.json();
        const parseResult = MenuItemSchema.safeParse(data);

        if (!parseResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid input data',
                    errors: parseResult.error.format()
                },
                { status: 400 }
            );
        }

        const existingItem = await MenuItem.findOne({
            name: { $regex: new RegExp(`^${parseResult.data.name}$`, 'i') },
            category: parseResult.data.category
        });

        if (existingItem) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Menu item already exists',
                    error: 'An item with this name already exists in this category'
                },
                { status: 409 }
            );
        }

        const menuItem = new MenuItem({
            ...parseResult.data,
            createdAt: new Date(),
        });

        await menuItem.save();

        return NextResponse.json({
            success: true,
            data: menuItem,
            message: 'Menu item created successfully'
        }, { status: 201 });

    } catch (error: any) {
        console.error('POST Error:', error);

        if (error.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Duplicate item',
                    error: 'An item with this information already exists'
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create menu item'
            },
            { status: 500 }
        );
    }
});
