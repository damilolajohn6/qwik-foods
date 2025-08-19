/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
    try {
        const { reference } = await request.json();

        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return NextResponse.json(response.data.data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response ? error.response.data : error.message },
            { status: 500 }
        );
    }
}
