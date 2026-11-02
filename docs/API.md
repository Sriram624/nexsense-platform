# API quick reference

Public:
- `GET /api/health`
- `POST /api/auth/register` body `{ "email": "...", "password": "at-least-10-chars" }`
- `POST /api/auth/login` same body; returns `{ "token": "...", "email": "..." }`

Authenticated (header `Authorization: Bearer <token>`):
- `GET /api/devices`
- `POST /api/devices` body `{ "id": "ESP32-001", "name": "Workshop Sensor", "location": "Workshop" }`
- `GET /api/devices/{id}/readings`
- `GET /api/devices/{id}/insights`
- `POST /api/devices/{id}/relay` body `{ "on": true }`

The relay endpoint returns MQTT publish acceptance only, not proof of physical actuation.
