FROM node:20-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

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
CMD ["node", "--max-old-space-size=768", "server.js"]
