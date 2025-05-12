import { db } from '@/utils/db';
import { InterviewPrompt } from '@/utils/schema';
import { eq } from "drizzle-orm";

export async function POST(req) {
  try {
    const { publicUrl } = await req.json();

    if (!publicUrl) {
      return new Response(JSON.stringify({ error: 'Missing publicUrl' }), { status: 400 });
    }

    const result = await db
      .update(InterviewPrompt)
      .set({ supportingDocURL: null })
      .where(eq(InterviewPrompt.supportingDocURL, publicUrl));

    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (error) {
    console.error('Error clearing supportingDocURL:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}