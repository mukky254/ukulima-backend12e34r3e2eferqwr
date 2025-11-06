FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
