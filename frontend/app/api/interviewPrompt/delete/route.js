import { db } from '@/utils/db';
import { InterviewPrompt, SessionFeedback, UserAnswer, UserAnswerConversational } from '@/utils/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE(req) {
    try {
        const { id } = await req.json(); // Get the interview ID from request body

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing interview ID' }, { status: 400 });
        }

        // Get mockID of selected session from InterviewPrompt
        const interview = await db.select().from(InterviewPrompt).where(eq(InterviewPrompt.id, id));
        if (!interview || interview.length === 0) {
        return NextResponse.json({ success: false, message: 'Interview not found' }, { status: 404 });
        }
        const mockID = interview[0].mockID;
        
        // Delete rows with same mockID
        await db.delete(SessionFeedback).where(eq(SessionFeedback.mockIDRef, mockID));
        await db.delete(UserAnswer).where(eq(UserAnswer.mockIDRef, mockID));
        await db.delete(UserAnswerConversational).where(eq(UserAnswerConversational.mockIDRef, mockID));
        await db.delete(InterviewPrompt).where(eq(InterviewPrompt.id, id));

        return NextResponse.json({ success: true, message: 'Interview session and related data deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error deleting interview' }, { status: 500 });
    }
}
