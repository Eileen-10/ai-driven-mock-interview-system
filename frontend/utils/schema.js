import { pgEnum, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const quesTypeEnum = pgEnum('quesType', ['behavioural', 'technical', 'combination']);

export const InterviewPrompt=pgTable('interviewPrompt',{
    id:serial('id').primaryKey(),
    jsonMockResponse:text('jsonMockResponse').notNull(), //Response
    jobRole:varchar('jobRole').notNull(),   //Job Title
    jobDesc:varchar('jobDescr').notNull(),  //Job Scope
    quesType: quesTypeEnum(),               //Question Type
    supportingDoc:text('supportingDoc'),    //**Supporting Documents
    createdBy:varchar('createdBy').notNull(),
    createdAt:varchar('createdAt'),
    mockID:varchar('mockID').notNull()
})