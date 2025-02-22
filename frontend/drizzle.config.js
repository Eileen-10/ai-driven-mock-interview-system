import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./utils/schema.js",
  out: "./drizzle",
  dbCredentials: {
    url: "postgresql://ai-mock-interview-system_owner:3iDWQE6mCUHs@ep-falling-glitter-a16lav48.ap-southeast-1.aws.neon.tech/ai-mock-interview-system?sslmode=require",
  }
});
