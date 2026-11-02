# Run NexSense and connect an Android phone

## Start the backend

1. Install Docker Desktop and start its Linux engine.
2. Open the NexSense project root in VS Code.
3. Run `./run.ps1` in the PowerShell terminal, or double-click `RUN-NEXSENSE.bat`.
4. Confirm `http://localhost:8080/api/health` returns `status: UP`.

The launcher writes `mobile/.env` using the laptop's private LAN IPv4 address. Allow Docker Desktop / Java through Windows Firewall on **Private networks** if prompted. Keep the laptop and phone on the same Wi-Fi. Do not expose these development ports to the public internet.

## Start the mobile app on your phone

From a second VS Code terminal:

```powershell
cd mobile
npm install
npx expo start
```

Install Expo Go on Android, scan the QR code, and open the app. The phone must be able to reach `http://<laptop-LAN-IP>:8080`. If the IP changes, rerun `./run.ps1`.

## Build an installable APK

The APK is only the Android client. The API, PostgreSQL and MQTT broker run separately in Docker. A same-Wi-Fi APK can use the LAN URL in `mobile/.env`, but it will only work while the laptop is on and connected to that network. For access from mobile data or another Wi-Fi network, deploy the API behind HTTPS and configure `EXPO_PUBLIC_API_URL` in the EAS build environment to that public API URL before building.

```powershell
cd mobile
npm install
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

Download the generated APK from the EAS build page and install it on Android.

## API smoke check

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

The app uses these API routes (authenticated routes require the JWT returned by sign-in/register):

- `POST /api/auth/register` — JSON `{ "email": "you@example.com", "password": "at-least-10-chars" }`
- `POST /api/auth/login` — same JSON shape
- `GET /api/devices` — list registered devices
- `POST /api/devices` — JSON `{ "id": "ESP32-001", "name": "Room sensor", "location": "Bedroom" }`
- `GET /api/devices/{id}/readings` — latest readings
- `GET /api/devices/{id}/insights` — basic statistical anomaly insight
- `POST /api/devices/{id}/relay` — JSON `{ "on": true }`; this means MQTT publish accepted, not confirmed physical execution

## Troubleshooting

- Docker pipe / `dockerDesktopLinuxEngine` error: open Docker Desktop and wait for the engine to start.
- API not ready: run `./logs.ps1` and inspect the backend startup error.
- Phone cannot connect: verify same Wi-Fi, use the LAN IP (not `localhost` or `10.0.2.2`), and allow the private-network firewall prompt.
- Expo does not pick up a changed `.env`: stop Expo and restart with `npx expo start --clear`.
