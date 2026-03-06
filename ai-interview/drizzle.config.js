/**@type {import("drizzle-kit").Config} */
export default {
    schema: "./utils/schema.js",
    dialect: 'postgresql',
    dbCredentials: {
        url: 'postgresql://neondb_owner:npg_xeS3PbEwI1Gz@ep-morning-truth-ai1on8j7-pooler.c-4.us-east-1.aws.neon.tech/ai-interview?sslmode=require&channel_binding=require',
    }
};