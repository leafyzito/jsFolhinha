FROM node:18-alpine

WORKDIR /app

# Install git, docker and docker-compose
RUN apk add --no-cache git docker-cli docker-compose && \
    git config --global --add safe.directory /app

COPY package*.json ./
RUN npm install

COPY . .

# Run depending on the environment declared in docker-compose.yml
CMD if [ "$ENV" = "prod" ]; then \
    npm run start; \
    else \
    npm run dev; \
    fi 