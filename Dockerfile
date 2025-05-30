FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Run depending on the environment declared in docker-compose.yml
CMD if [ "$ENV" = "prod" ]; then \
    npm run start; \
    else \
    npm run dev; \
    fi 