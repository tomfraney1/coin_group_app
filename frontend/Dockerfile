# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:prod

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.js ./
COPY package*.json ./
RUN npm install --production
ENV PORT=8080
EXPOSE ${PORT}
CMD ["node", "server.js"] 