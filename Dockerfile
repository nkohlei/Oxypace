FROM node:20-slim

WORKDIR /app

# Copy ONLY package files first for better caching
COPY package.json ./

# Install dependencies
# We use --omit=dev to keep the image small
RUN npm install --omit=dev --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
