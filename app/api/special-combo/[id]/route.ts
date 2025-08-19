/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SpecialCombo from '@/models/SpecialCombo';
import mongoose from 'mongoose';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const { id } = params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid combo ID' },
                { status: 400 }
            );
        }

        const combo = await SpecialCombo.findById(id)
            .populate({
                path: 'items._id',
                select: 'name price category available',
                options: { strictPopulate: false }
            })
            .lean();

        if (!combo) {
            return NextResponse.json(
                { success: false, message: 'Combo not found' },
                { status: 404 }
            );
        }

        // Transform the data similar to the main route
        const transformedCombo = {
            ...combo,
            items: combo.items.map((item: any) => {
                if (typeof item._id === 'string') {
                    return {
                        _id: item._id,
                        name: 'Unknown Item',
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
            }),
        };

        return NextResponse.json({
            success: true,
            data: transformedCombo,
            message: 'Combo fetched successfully'
        });

    } catch (error) {
        console.error('Error fetching combo:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}