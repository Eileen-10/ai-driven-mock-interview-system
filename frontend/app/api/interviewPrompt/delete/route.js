import { db } from '@/utils/db';
import { InterviewPrompt } from '@/utils/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE(req) {
    try {
        const { id } = await req.json(); // Get the interview ID from request body

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing interview ID' }, { status: 400 });
        }

        await db.delete(InterviewPrompt).where(eq(InterviewPrompt.id, id));

        return NextResponse.json({ success: true, message: 'Interview session deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error deleting interview' }, { status: 500 });
    }
}
