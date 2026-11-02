# NexSense IoT Platform — expanded development build

A general-purpose IoT mobile platform foundation using React Native + Expo, Spring Boot, PostgreSQL, MQTT, Docker, Python simulator and ESP32 firmware.

## Start on Windows (one command)
1. Install Docker Desktop, Node.js LTS and Python.
2. Open Docker Desktop and wait for its Linux engine to start.
3. Extract this archive and open the project root in VS Code (the folder containing `docker-compose.yml`).
4. In the VS Code PowerShell terminal run ` .\run.ps1` (without the leading space). This builds and starts PostgreSQL, Mosquitto and the Spring Boot API, waits for the API health endpoint, and writes the laptop LAN address into `mobile/.env` for a phone on the same Wi-Fi.
5. In another terminal run:
   ```powershell
   py -m pip install -r simulator/requirements.txt
   py simulator/simulate.py
   ```
6. Create an account from the mobile app after configuring `mobile/.env`.
7. Register a device from the Devices tab using an ID such as `ESP32-001`.
8. Set `EXPO_PUBLIC_API_URL` to your laptop LAN address for a physical phone.
9. Run:
   ```powershell
   cd mobile
   npm install
   npx expo start
   ```

## Build Android APK
The APK is a separate Android client; it does not contain Docker, PostgreSQL or the backend. For a same-Wi-Fi test, make sure `mobile/.env` contains the LAN IP printed by `run.ps1`, then build with that URL available to Expo. For use away from your Wi-Fi, deploy the API and MQTT broker to a secure public host and use its HTTPS API URL instead.

From `mobile`:
```powershell
npm install
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```
Download the APK from the EAS build page. The backend is not packaged inside the APK; it must be running and reachable separately.

## Read next
- `WINDOWS_QUICKSTART.md`
- `docs/PRODUCT_SCOPE.md`
- `docs/ROADMAP.md`
- `docs/API.md`
- `docs/DEVICE_PROTOCOL.md`
- `SECURITY.md`

## Honest feature status
The project now includes a richer mobile navigation/UI foundation and the previously implemented API-backed functions. Several advanced modules (drag-and-drop dashboards, real automation engine, push notifications, QR/Bluetooth provisioning, OTA, offline sync, multi-tenant ownership, WebSockets and production-grade security) are specified but are **not yet fully implemented**. See `docs/PRODUCT_SCOPE.md`. This is not a Blynk-equivalent finished product and must not be deployed publicly as-is.

## Phone and API setup
See `docs/PHONE_AND_API_SETUP.md` for LAN access, APK setup, API routes and troubleshooting.
