FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
