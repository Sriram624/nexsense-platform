package com.nexsense.device;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "devices")
public class Device {
    @Id @Column(length = 80) private String id;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private String location;
    @Column(nullable = false) private boolean online;
    private boolean relayOn;
    private Instant lastSeen;

    protected Device() {}
    public Device(String id, String name, String location) {
        this.id = id; this.name = name; this.location = location; this.online = false;
    }
    public String getId(){return id;} public String getName(){return name;}
    public String getLocation(){return location;} public boolean isOnline(){return online;}
    public boolean isRelayOn(){return relayOn;} public Instant getLastSeen(){return lastSeen;}
    public void setOnline(boolean v){online=v;} public void setRelayOn(boolean v){relayOn=v;}
    public void setLastSeen(Instant v){lastSeen=v;}
}
