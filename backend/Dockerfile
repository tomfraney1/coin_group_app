# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm install --production
# Create data directory and copy the CSV file
RUN mkdir -p /app/data
COPY --from=build /app/data/product_database.csv /app/data/
ENV PORT=8080
ENV CSV_FILE_PATH=/app/data/product_database.csv
EXPOSE ${PORT}
CMD ["node", "dist/server.js"] 