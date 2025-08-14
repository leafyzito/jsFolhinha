FROM golang:1.21-alpine

WORKDIR /app

# Install ffmpeg and other necessary packages
RUN apk add --no-cache ffmpeg git

COPY go.mod ./
RUN go mod download

COPY . .

# Build the application
RUN go build -o main .

# Expose the port the app runs on
EXPOSE 8989

CMD ["./main"] 