/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SpecialCombo from '@/models/SpecialCombo';
import { withRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

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

export const GET = withRateLimit(async (request: Request) => {
    try {
        await connectDB();

        const featuredCombos = await SpecialCombo.find({
            available: true,
            featured: true,
        })
            .populate({
                path: 'items._id',
                select: 'name price',
            })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        if (!featuredCombos || featuredCombos.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No featured combos found.',
                data: []
            }, { status: 404 });
        }

        const combosWithNames = featuredCombos.map(combo => {
            interface ComboItem {
                _id: {
                    name: string;
                    price: number;
                };
                quantity: number;
            }

            interface EnhancedComboItem {
                name: string;
                quantity: number;
            }

            const comboItems: EnhancedComboItem[] = (combo.items as ComboItem[]).map((item: ComboItem) => ({
                name: item._id.name,
                quantity: item.quantity,
            }));

            return {
                ...combo,
                items: comboItems,
            };
        });

        const response = NextResponse.json({
            success: true,
            data: combosWithNames,
            message: 'Successfully fetched featured combos'
        }, { status: 200 });

        response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
        return response;
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
});

export const POST = withRateLimit(async (request: Request) => {
    await connectDB();

    try {
        const body = await request.json();
        const validatedData = CreateComboSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { success: false, message: 'Invalid input data', errors: validatedData.error.format() },
                { status: 400 }
            );
        }

        const { name, description, items, totalPrice, imageUrl, available, featured } = validatedData.data;

        const newCombo = new SpecialCombo({
            name,
            description,
            items: items.map(item => ({ _id: item._id, quantity: item.quantity })),
            totalPrice,
            imageUrl,
            available,
            featured,
        });

        await newCombo.save();

        return NextResponse.json(
            { success: true, data: newCombo, message: 'Special combo created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
});
