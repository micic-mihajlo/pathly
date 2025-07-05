import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateUserUniversity } from '@/lib/user-sync';
export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { university } = await req.json();
        if (!university) {
            return NextResponse.json({ error: 'University is required' }, { status: 400 });
        }
        await updateUserUniversity(userId, university);
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error updating university:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
