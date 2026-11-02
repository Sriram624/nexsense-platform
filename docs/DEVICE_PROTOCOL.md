# Device protocol (development contract)

Telemetry topic:
`nexsense/devices/{deviceId}/telemetry`

Command topic:
`nexsense/devices/{deviceId}/command`

Recommended next-version telemetry envelope:
```json
{
  "schemaVersion": 1,
  "deviceId": "ESP32-001",
  "messageId": "unique-uuid",
  "sequence": 1042,
  "recordedAt": "2026-11-02T10:00:00Z",
  "metrics": {
    "temperatureC": 27.4,
    "relativeHumidityPct": 61.2
  },
  "state": {
    "relay1": false
  }
}
```

Recommended command envelope:
```json
{
  "schemaVersion": 1,
  "commandId": "unique-uuid",
  "deviceId": "ESP32-001",
  "issuedAt": "2026-11-02T10:01:00Z",
  "expiresAt": "2026-11-02T10:01:30Z",
  "action": "SET_OUTPUT",
  "parameters": {"output": "relay1", "value": true}
}
```

Recommended acknowledgement topic:
`nexsense/devices/{deviceId}/ack`

A command must be shown as pending until a matching acknowledgement is received. MQTT publish success alone is not proof of actuation.
