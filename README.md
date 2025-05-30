# [FolhinhaBot](https://folhinhabot.com/)

## Setup
1. Clone and install:
```bash
git clone https://github.com/leafyzito/jsFolhinha.git
cd jsFolhinha
git submodule update --init --recursive
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials

3. Run:
```bash
npm start
```

## Docker Setup
To run the application using Docker Compose:

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

## License
ISC License (idk im new at this)