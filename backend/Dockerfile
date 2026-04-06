FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Create data directory for JSON file
RUN mkdir -p data

EXPOSE 5000

CMD ["npm", "start"]
