package com.nexsense.reading;

import com.nexsense.device.Device;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="readings", indexes=@Index(name="idx_reading_device_time", columnList="device_id, recorded_at"))
public class Reading {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false, fetch=FetchType.LAZY) @JoinColumn(name="device_id") private Device device;
    private double temperature;
    private double humidity;
    private boolean relayOn;
    @Column(nullable=false) private Instant recordedAt;

    protected Reading() {}
    public Reading(Device d, double t, double h, boolean relay, Instant at) {
        device=d; temperature=t; humidity=h; relayOn=relay; recordedAt=at;
    }
    public Long getId(){return id;} public double getTemperature(){return temperature;}
    public double getHumidity(){return humidity;} public boolean isRelayOn(){return relayOn;}
    public Instant getRecordedAt(){return recordedAt;}
    public String getDeviceId(){return device.getId();}
}
