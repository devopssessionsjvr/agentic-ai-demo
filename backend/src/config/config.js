
// Dummy config for demo
const getEnv = (key) => process.env[key] || "demo";

export const config = {
  mongoUrl: getEnv("MONGO_URL"),
  accessTokenSecret: getEnv("ACCESS_TOKEN_SECRET"),
  rapidApiKey: getEnv("RAPID_API_KEY"),
  googleAIKey: getEnv("GOOGLE_GENERATIVE_AI_KEY"),
  stripeSecretKey: getEnv("STRIPE_SECRET_KEY"),
  emailUser: getEnv("EMAIL_USER"),
  emailPassword: getEnv("EMAIL_PASSWORD"),
};
