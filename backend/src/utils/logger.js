const logger = {
  info: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`);
    }
  },
  warn: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] [${new Date().toISOString()}] ${message}`);
    }
  },
  error: (message, err) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`);
    if (err) console.error(err);
  },
};

export default logger;
