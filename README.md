# WhatsApp Clone Backend

A powerful real-time messaging backend service built with Node.js and WebSockets for the WhatsApp Clone application.

## Overview

This backend service provides real-time messaging capabilities, user authentication, and video call signaling for a complete messaging experience. Built with modern JavaScript technologies and hosted on Render.

## Key Features

- Real-time messaging via WebSockets
- User authentication and session management
- Message routing between users
- Video call signaling support
- Cloud-based deployment on Render

## Technology Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Express-ws** - WebSocket integration for Express
- **Firebase** - Authentication and data storage
- **Stream SDK** - Video calling capabilities
- **JSON Web Tokens** - Secure authentication

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/whatsapp-clone-backend.git
   cd whatsapp-clone-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables in a `.env` file:
   ```
   PORT=3000
   FIREBASE_CONFIG=your_firebase_credentials
   STREAM_API_KEY=your_stream_api_key
   STREAM_SECRET=your_stream_secret
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

- `POST /api/auth` - User authentication
- `GET /api/users` - Get user list
- `POST /api/stream/token` - Generate Stream video token

## WebSocket Communication

The server establishes WebSocket connections for real-time message delivery. Messages are sent and received in JSON format and must be properly stringified when sending:

```javascript
// Example of sending a message
socket.send(JSON.stringify({
  type: "message_sent",
  message: "Hello!",
  sender: "userId1",
  receiver: "userId2"
}));
```

## Deployment

The application is hosted on Render with automatic deployment from the main branch. Environment variables are configured in the Render dashboard.

## Development

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License.
