import { integer, numeric, pgEnum, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const quesTypeEnum = pgEnum('quesType', ['behavioural', 'technical', 'combination']);

export const InterviewPrompt = pgTable('interviewPrompt', {
    id:serial('id').primaryKey(),
    jsonMockResponse:text('jsonMockResponse').notNull(), //Response
    jobRole:varchar('jobRole').notNull(),   //Job Title
    jobDesc:varchar('jobDesc').notNull(),  //Job Scope
    quesType: quesTypeEnum(),               //Question Type
    supportingDoc:text('supportingDoc'),    //**Supporting Documents
    createdBy:varchar('createdBy').notNull(),
    createdAt:varchar('createdAt'),
    mockID:varchar('mockID').notNull()
})

export const UserAnswer = pgTable('userAnswer', {
    id:serial('id').primaryKey(),
    mockIDRef:varchar('mockID').notNull(),
    question:varchar('question').notNull(),
    suggestedAns:text('suggestedAns'),
    userAns:text('userAns'),
    similarityScore:numeric('similarityScore'),
    rating:integer('rating'),
    feedback:text('feedback'),
    createdBy:varchar('createdBy'),
    createdAt:varchar('createdAt')
})