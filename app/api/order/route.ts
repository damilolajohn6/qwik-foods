import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import Pusher from 'pusher';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { items, total, paymentReference } = await request.json();

    // Verify payment before creating order
    const verifyResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/paystack/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: paymentReference }),
    });

    if (!verifyResponse.ok || (await verifyResponse.json()).status !== 'success') {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    const order = new Order({
        userId: session.user.id,
        items,
        total,
        paymentReference,
        status: 'paid',
    });
    await order.save();

    // Trigger Pusher event for real-time updates
    const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.PUSHER_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: process.env.PUSHER_CLUSTER!,
        useTLS: true,
    });
    await pusher.trigger('orders', 'new-order', order);

    return NextResponse.json(order, { status: 201 });
}
