# Multi-stage / standard production build for SupplyChainPro
FROM node:20-alpine AS production

# Install build dependencies required for native modules (sqlite3/node-gyp)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root and subproject package manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install root dependencies
RUN npm install --omit=dev

# Install client dependencies & server dependencies
RUN cd client && npm install
RUN cd server && npm install --omit=dev

# Copy source code
COPY . .

# Build client production bundle
RUN cd client && npm run build

# Default environment variables
ENV NODE_ENV=production
ENV DB_TYPE=sqlite
ENV PORT=5000

EXPOSE 5000

# Start unified server
CMD ["node", "server/server.js"]
