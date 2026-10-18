# Multi-stage production build for NERAMP Full-Stack Platform
FROM node:22-alpine AS build

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy full application source and build client bundle
COPY . .
RUN npm run build

# Production Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy application artifacts, shared constants, static assets, and node dependencies
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/public ./public
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/docs ./docs

# Create writable data directory and ensure non-root node user permissions
RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3000

# Start production server on PORT (3000)
CMD ["node", "server.ts"]
