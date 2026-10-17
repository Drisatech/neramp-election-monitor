# Multi-stage production build for NERAMP Full-Stack Platform
FROM node:20-alpine AS build

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy full application source and build client bundle
COPY . .
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy application artifacts and node dependencies
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/docs ./docs

# Ensure non-root node user permissions
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Start server using tsx
CMD ["npx", "tsx", "server.ts"]
