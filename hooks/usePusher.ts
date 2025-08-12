/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import Pusher from 'pusher-js';

export function usePusher(channelName: string, eventName: string, callback: (data: any) => void) {
    useEffect(() => {
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });
        const channel = pusher.subscribe(channelName);
        channel.bind(eventName, callback);

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, [channelName, eventName, callback]);
}