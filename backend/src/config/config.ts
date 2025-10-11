export default {
  PORT: process.env.PORT || 8080,
  SECRET: "secret",
  LOGGING_URL:
    process.env.LOGGING_URL ||
    "mongodb+srv://rajazainulabadin_db_user:ba99QD1HLj1fmP0k@logistics.akjhz8o.mongodb.net/logs?retryWrites=true&w=majority&appName=Logistics",
};
