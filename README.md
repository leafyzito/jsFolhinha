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
For running the complete application with all services (including Cobalt[https://github.com/imputnet/cobalt/] and Twitch Clipper[https://github.com/leafyzito/twitch-clipper]):

1. Make sure you have Docker and Docker Compose installed

2. Start the application:
```bash
docker compose up -d
```

To stop the application:
```bash
docker compose down
```

## Project Structure
- `main.js` - Main application entry point
- `commands/` - Directory containing bot commands
- `utils/` - Utility functions and helpers
- `scripts/` - Additional scripts and tools
- `twitchClipper/` - Submodule for Twitch clipping functionality

## Contributing
Feel free to contribute to the project by opening issues or submitting pull requests with your ideas.