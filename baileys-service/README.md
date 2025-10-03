# Baileys WhatsApp Service

Node.js/TypeScript service that wraps [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) library and exposes a REST API for integration with the .NET WhatsApp microservice.

## Features

- ✅ WhatsApp Web API integration via Baileys
- ✅ Session management with persistence
- ✅ QR Code generation for authentication
- ✅ Send text, media, location, and audio messages
- ✅ Automatic reconnection handling
- ✅ REST API for .NET integration
- ✅ Docker support

## API Endpoints

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/initialize` | Initialize a new WhatsApp session |
| GET | `/api/sessions/:sessionId/status` | Get session status |
| GET | `/api/sessions` | List all sessions |
| DELETE | `/api/sessions/:sessionId` | Disconnect and remove session |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages/text` | Send text message |
| POST | `/api/messages/media` | Send media (image, video, document) |
| POST | `/api/messages/location` | Send location |
| POST | `/api/messages/audio` | Send audio message |

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/` | API documentation |

## Installation

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

### Docker

```bash
# Build Docker image
docker build -t baileys-service .

# Run container
docker run -p 3000:3000 \
  -v $(pwd)/sessions:/app/sessions \
  -e NODE_ENV=production \
  baileys-service
```

## Configuration

Environment variables (`.env`):

```env
PORT=3000
NODE_ENV=development
SESSION_STORAGE_PATH=./sessions
LOG_LEVEL=info
API_KEY=your-secret-api-key-here
```

## Usage Examples

### Initialize Session

```bash
curl -X POST http://localhost:3000/api/sessions/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "phoneNumber": "+5511999999999"
  }'
```

Response:
```json
{
  "status": "qr_required",
  "qrCode": "2@abcd1234..."
}
```

### Send Text Message

```bash
curl -X POST http://localhost:3000/api/messages/text \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "to": "+5511888888888",
    "content": "Hello from Baileys!"
  }'
```

Response:
```json
{
  "messageId": "3EB0XXXXX",
  "status": "sent"
}
```

### Send Media Message

```bash
curl -X POST http://localhost:3000/api/messages/media \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "to": "+5511888888888",
    "mediaBase64": "iVBORw0KGgoAAAANSUhE...",
    "mediaType": "image",
    "caption": "Check this out!"
  }'
```

## Architecture

```
baileys-service/
├── src/
│   ├── index.ts              # Express server
│   ├── services/
│   │   └── SessionManager.ts # Baileys session management
│   └── routes/
│       ├── session.routes.ts # Session endpoints
│       └── message.routes.ts # Message endpoints
├── sessions/                 # Session storage (persisted)
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## Integration with .NET Service

The .NET WhatsApp API communicates with this service via HTTP:

1. .NET receives request to send message
2. .NET calls this service's REST API
3. This service uses Baileys to send via WhatsApp Web
4. Response is returned to .NET
5. .NET persists message in database

```
┌─────────────┐   HTTP    ┌──────────────────┐   WhatsApp   ┌──────────┐
│   .NET API  │ ───────> │ Baileys Service  │  ─────────>  │ WhatsApp │
│  (C# + EF)  │          │ (Node.js + TS)   │              │   Web    │
└─────────────┘          └──────────────────┘              └──────────┘
```

## Session Persistence

Sessions are stored in the `sessions/` directory using Baileys' multi-file auth state:

```
sessions/
└── session-123/
    ├── creds.json
    └── app-state-sync-*.json
```

This allows sessions to persist across restarts without requiring re-authentication.

## Troubleshooting

### Session not connecting

1. Check if QR code is being scanned
2. Verify session files are being persisted
3. Check logs for connection errors

### Messages not sending

1. Verify session is connected: `GET /api/sessions/:sessionId/status`
2. Check if phone number format is correct
3. Review logs for Baileys errors

### Docker issues

1. Ensure sessions volume is mounted correctly
2. Check if ports are available
3. Verify environment variables are set

## License

MIT

## Credits

Built with [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) - the best WhatsApp Web API library for Node.js.