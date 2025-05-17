import { boolean, integer, numeric, pgEnum, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const quesTypeEnum = pgEnum('quesType', ['behavioural', 'technical', 'combination']);
export const QBquesTypeEnum = pgEnum('QBquesType', ['behavioral', 'technical']);
export const QBquesCategoryEnum = pgEnum('QBquesCategory', ['general', 'healthcare', 'engineering & it', 'business & finance', 'public safety', 'customer service','education & literacy', 'social services']);

export const InterviewPrompt = pgTable('interviewPrompt', {
    id:serial('id').primaryKey(),
    jsonMockResponse:text('jsonMockResponse').notNull(),        // IV Ques & Suggested Ans
    jobRole:varchar('jobRole'),                                 // Job Title
    jobDesc:varchar('jobDesc'),                                 // Job Scope
    quesType: quesTypeEnum(),                                   // Question Type
    numOfQues:integer('numOfQues'),                             // Num of Ques
    conversationalMode:boolean('conversationalMode').notNull(), // Default/Conversational Mode
    supportingDoc:text('supportingDoc'),                        // Supporting Document Name
    supportingDocURL:text('supportingDocURL'),                  // Supporting Document URL
    isCustom:boolean('isCustom').notNull(),                     // Generated/Custom Session
    createdBy:varchar('createdBy').notNull(),
    createdAt:varchar('createdAt'),
    mockID:varchar('mockID').notNull()                          //Unique session ID
})

export const UserAnswer = pgTable('userAnswer', {
    id:serial('id').primaryKey(),
    mockIDRef:varchar('mockID').notNull(),
    question:varchar('question').notNull(),         // IV Ques
    suggestedAns:text('suggestedAns').notNull(),    // Suggested Ans
    userAns:text('userAns'),                        // User Ans
    similarityScore:numeric('similarityScore'),     // Similarity Score
    rating:integer('rating'),                       // Rating
    feedback:text('feedback'),                      // Feedback
    audioURL:text('audioURL'),                      // Audio recording URL
    createdBy:varchar('createdBy'),
    createdAt:varchar('createdAt')
})

export const UserAnswerConversational = pgTable('userAnswerConversational', {
    id:serial('id').primaryKey(),
    mockIDRef:varchar('mockID').notNull(),
    dialog:text('dialog'),                  // Interviewer & User dialog
    audioURL:text('audioURL'),              // Audio recording URL
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

export const QuestionBank = pgTable('questionBank', {
    id:serial('id').primaryKey(),
    question:varchar('question').notNull(),     // Question
    quesType:QBquesTypeEnum(),                  // Question Type
    category:QBquesCategoryEnum(),              // Category
    jobRole:varchar('jobRole'),                 // Job role/position name
    createdBy:varchar('createdBy'),
    createdAt:varchar('createdAt')
})
