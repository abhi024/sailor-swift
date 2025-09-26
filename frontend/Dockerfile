# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Install Python and build tools for native dependencies
RUN apk add --no-cache python3 py3-pip make g++

# Set working directory
WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port 5173 for Vite dev server (default Vite port)
EXPOSE 5173

# Start the Vite development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]