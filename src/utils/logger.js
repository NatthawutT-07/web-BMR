// src/utils/logger.js

const isDev = process.env.NODE_ENV !== "production";
// localStorage.setItem("debug", "true");


const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
};

export default logger;
