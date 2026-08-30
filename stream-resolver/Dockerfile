# Official Playwright Node.js image with pre-installed Chromium and Linux system dependencies
FROM mcr.microsoft.com/playwright/node:v18-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

# Start application
CMD ["node", "server.js"]
