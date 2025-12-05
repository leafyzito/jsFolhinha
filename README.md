# [FolhinhaBot](https://folhinhabot.com/)

## Setup

### First Steps

1. Clone the repository and initialize submodules:

```bash
git clone https://github.com/leafyzito/jsFolhinha.git
cd jsFolhinha
git submodule update --init --recursive
```

2. Copy `.env.example` to `.env` and fill in your credentials

### Development Mode

For development and testing without all services:

1. Install dependencies:

```bash
npm install
```

2. Run the application:

```bash
npm run dev
```

### Production Mode (Docker)

For running the complete application with all services (including [Cobalt](https://github.com/imputnet/cobalt/) and [Twitch Clipper](https://github.com/leafyzito/twitch-clipper)):

1. Make sure you have Docker and Docker Compose installed

2. Ensure the environment variable ENV is set to 'prod' in docker-compose.yml (or 'dev' for testing)

3. Start the application:

```bash
docker compose up -d
```

To stop the application:

```bash
docker compose down
```

## Project Structure

- `main.js` - Main application entry point
- `src/` - Source code directory
  - `apis/` - API integrations
  - `clients/` - Client connections
  - `commands/` - Bot commands and handlers
  - `db/` - Database operations
  - `extras/` - Extra files/functions
  - `handlers/` - Event handlers and middleware
  - `log/` - Logging functionality
  - `tasks/` - Scheduled tasks and background jobs
  - `utils/` - Utility functions and helpers
- `scripts/` - Additional scripts and tools
- `apps/twitchClipper/` - [Go-based Twitch clipping functionality](https://github.com/leafyzito/twitch-clipper/)

## API

The bot includes a built-in HTTP api server for monitoring and uptime tracking:

### Endpoint

- **`/`** - Detailed status with uptime information

### Configuration

The api server runs on port 3000 by default. You can customize this by setting the `STATUS_PORT` environment variable:

```bash
STATUS_PORT=8080
```

### Example Response

```json
{
  "status": "running",
  "uptime": 3600,
  "uptimeFormatted": "1h 0m 0s",
  "startTime": 1703123456,
  "connectedChannels": 1,
  "channelsToJoin": 1
}
```

## Code Quality

### Linting

This project uses ESLint for code quality and consistency.

#### Available Commands

- `npm run lint` - Check for linting issues
- `npm run lint:fix` - Automatically fix linting issues where possible

## Contributing

Feel free to contribute to the project by opening issues or submitting pull requests with your ideas :)

**Before submitting code:**

1. Run `npm run lint` to check for code quality issues
2. Run `npm run lint:fix` to automatically fix any auto-fixable issues
