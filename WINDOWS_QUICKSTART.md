# Windows quick start

1. Install Docker Desktop, Node.js LTS and Python.
2. Open Docker Desktop and wait until its engine is running.
3. Extract this folder. In PowerShell, `cd` into the directory that contains `docker-compose.yml`.
4. Run `docker compose up --build`.
5. In another terminal, from this folder run:
   `py -m pip install -r simulator/requirements.txt`
   `py simulator/simulate.py`
6. Register an account from the mobile app or use the API.
7. Create the demo device using the authenticated API (see README.md).
8. Set `mobile/.env` to your laptop LAN IP, then run `cd mobile`, `npm install`, `npx expo start`.
9. To create an APK, use `eas login`, `eas build:configure`, then `eas build --platform android --profile preview`.

If Docker reports that it cannot connect to `dockerDesktopLinuxEngine`, open Docker Desktop and wait for the Linux engine to start. `docker version` should show both Client and Server sections.
