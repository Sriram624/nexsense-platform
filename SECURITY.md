# Security checklist before public deployment

The local compose environment is for development only.

- [ ] Replace `POSTGRES_PASSWORD` and `JWT_SECRET` with unique random values.
- [ ] Do not commit `.env` files or credentials.
- [ ] Configure Mosquitto authentication, per-device ACLs and TLS.
- [ ] Expose API only behind HTTPS reverse proxy.
- [ ] Restrict CORS to exact production app/web origins.
- [ ] Add device ownership and tenant authorization on every device endpoint.
- [ ] Rate-limit registration/login and MQTT command endpoints.
- [ ] Add refresh-token rotation, logout/revocation and account recovery.
- [ ] Validate topic-to-device identity and sign/provision device identities.
- [ ] Persist commands and require device acknowledgement with correlation IDs.
- [ ] Add audit logs, metrics, alerting, backup/restore and retention.
- [ ] Perform dependency, threat-model and penetration testing.
- [ ] Review hardware relay isolation, enclosure and electrical safety.
