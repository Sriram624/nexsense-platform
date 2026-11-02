package com.nexsense.mqtt;

import jakarta.validation.constraints.*;
import java.time.Instant;

public record TelemetryMessage(
    @NotBlank String deviceId,
    @NotNull @DecimalMin("-40.0") @DecimalMax("125.0") Double temperature,
    @NotNull @DecimalMin("0.0") @DecimalMax("100.0") Double humidity,
    boolean relayOn,
    Instant recordedAt
) {}
