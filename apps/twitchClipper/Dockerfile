FROM golang:1.21-alpine

WORKDIR /app

# Install ffmpeg
RUN apk add --no-cache ffmpeg

COPY go.mod ./
RUN go mod download

COPY . .

CMD ["go", "run", "."] 