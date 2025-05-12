import { boolean, integer, numeric, pgEnum, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const quesTypeEnum = pgEnum('quesType', ['behavioural', 'technical', 'combination']);

export const InterviewPrompt = pgTable('interviewPrompt', {
    id:serial('id').primaryKey(),
    jsonMockResponse:text('jsonMockResponse').notNull(),        // IV Ques & Suggested Ans
    jobRole:varchar('jobRole').notNull(),                       // Job Title
    jobDesc:varchar('jobDesc').notNull(),                       // Job Scope
    quesType: quesTypeEnum().notNull(),                         // Question Type
    numOfQues:integer('numOfQues').notNull(),                   // Num of Ques
    conversationalMode:boolean('conversationalMode').notNull(), // Default/Conversational Mode
    supportingDoc:text('supportingDoc'),                        // **Supporting Documents
    supportingDocURL:text('supportingDocURL'),
    createdBy:varchar('createdBy').notNull(),
    createdAt:varchar('createdAt'),
    mockID:varchar('mockID').notNull()
})

export const UserAnswer = pgTable('userAnswer', {
    id:serial('id').primaryKey(),
    mockIDRef:varchar('mockID').notNull(),
    question:varchar('question').notNull(),     // IV Ques
    suggestedAns:text('suggestedAns').notNull(),// Suggested Ans
    userAns:text('userAns'),                    // User Ans
    similarityScore:numeric('similarityScore'), // Similarity Score
    rating:integer('rating'),                   // Rating
    feedback:text('feedback'),                  // Feedback
    createdBy:varchar('createdBy'),
    createdAt:varchar('createdAt')
})

export const UserAnswerConversational = pgTable('userAnswerConversational', {
    id:serial('id').primaryKey(),
    mockIDRef:varchar('mockID').notNull(),
    dialog:text('dialog'),                  // Interviewer & User dialog
    createdBy:varchar('createdBy'),
    createdAt:varchar('createdAt')
})

export const SessionFeedback = pgTable('sessionFeedback', {
    id:serial('id').primaryKey(),
    mockIDRef:varchar('mockID').notNull(),
    overallRating:integer('overallRating'),     // Session overall rating
    probSolRating:integer('probSolRating'),     // Problem Solving rating
    commRating:integer('commRating'),           // Communication rating
    techRating:integer('techRating'),           // Technical Knowledge rating
    confRating:integer('confRating'),           // Confidence & Clarity rating
    areaImprovement:text('areaImprovement'),    // Area for Improvement
    advice:text('advice'),                      // Actionable advice
    createdBy:varchar('createdBy'),
    createdAt:varchar('createdAt')
})