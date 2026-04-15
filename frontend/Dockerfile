# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy only dist folder and necessary files
COPY --from=builder /app/dist ./dist

# Install serve to run the app
RUN npm install -g serve

EXPOSE 3000

# Start serving the app
CMD ["serve", "-s", "dist", "-l", "3000"]
