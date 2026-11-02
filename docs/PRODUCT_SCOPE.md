# NexSense Platform — Product scope and implementation status

This project is being shaped as a general-purpose IoT platform. The current mobile application now has a multi-section shell for Home, Devices, Dashboards, Automations, Activity and Settings.

## Implemented in this codebase
- Account registration/login using Spring Security, BCrypt and JWT.
- Secure token storage on mobile using Expo SecureStore.
- Authenticated device list and device registration API.
- MQTT telemetry ingestion and relay command publishing.
- PostgreSQL telemetry persistence.
- Temperature history endpoint and simple statistical anomaly endpoint.
- Mobile overview, device list/registration form, basic history bars, event feed.
- Python simulator and ESP32 example firmware.
- Docker Compose local infrastructure.

## UI foundation only / not yet operational
- Dashboard widget catalogue: no drag/drop editor or persisted layouts.
- Automation designer: no persisted rules, scheduler or execution engine.
- Activity view: displays telemetry rows; no durable event/audit subsystem.
- Settings menu: no preferences, device sharing or integration management screens.
- Provisioning: device IDs can be registered manually; no QR/BLE onboarding.
- Notification preferences: no push notification provider or delivery service.

## Not yet implemented
- Multi-tenant device ownership and sharing permissions.
- WebSocket/SSE live streaming (mobile currently polls REST).
- Offline-first queue and conflict-safe synchronization.
- Push notifications.
- Firmware OTA update orchestration and signed firmware validation.
- Energy metering/consumption analytics (requires supported sensors and calibration).
- Advanced charts, user-configurable dashboards and widget bindings.
- Robust command lifecycle: command IDs, persistence, acknowledgement, retries, expiry and audit trail.
- Rule engine with schedules, conditions, safe actions, simulation and audit.
- Device heartbeat timeout / accurate online status.
- MQTT TLS, per-device credentials and broker ACLs.
- Production migrations, rate limits, monitoring, backups and deployment hardening.

## Reliability and safety notes
Do not connect the development MQTT broker to the public internet. It allows anonymous access for local development. The sample relay firmware is not a safety-rated controller. Never use it as the sole controller for life-safety, heating, cooling, industrial machinery, pumps, locks or mains equipment. Use independent hardware interlocks and qualified electrical design.
