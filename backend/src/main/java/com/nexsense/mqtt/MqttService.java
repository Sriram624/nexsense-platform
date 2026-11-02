package com.nexsense.mqtt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexsense.config.MqttProperties;
import com.nexsense.device.*;
import com.nexsense.reading.*;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.*;

@Service
public class MqttService {
    private final MqttProperties props;
    private final ObjectMapper mapper;
    private final DeviceRepository devices;
    private final ReadingRepository readings;
    private final ScheduledExecutorService reconnect = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t=new Thread(r,"mqtt-reconnect"); t.setDaemon(true); return t;
    });
    private volatile MqttClient client;

    public MqttService(MqttProperties p, ObjectMapper m, DeviceRepository d, ReadingRepository r) {
        props=p; mapper=m; devices=d; readings=r;
    }

    @PostConstruct void start() {
        reconnect.scheduleWithFixedDelay(this::connectIfNeeded,0,5,TimeUnit.SECONDS);
    }

    private synchronized void connectIfNeeded() {
        try {
            if (client != null && client.isConnected()) return;
            MqttClient candidate=new MqttClient(props.brokerUrl(),props.clientId(),new MemoryPersistence());
            MqttConnectOptions options=new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(8);
            options.setKeepAliveInterval(30);
            if (props.username()!=null && !props.username().isBlank()) {
                options.setUserName(props.username());
                options.setPassword(props.password().toCharArray());
            }
            candidate.connect(options);
            candidate.subscribe("nexsense/devices/+/telemetry",1,this::onMessage);
            client=candidate;
        } catch (Exception e) {
            System.err.println("MQTT unavailable; retry scheduled: "+e.getMessage());
        }
    }

    private void onMessage(String topic,MqttMessage message) {
        try {
            TelemetryMessage t=mapper.readValue(message.getPayload(),TelemetryMessage.class);
            if (t.deviceId()==null || t.temperature()==null || t.humidity()==null ||
                t.temperature() < -40 || t.temperature() > 125 ||
                t.humidity() < 0 || t.humidity() > 100) return;
            String topicDevice=topic.split("/")[2];
            if (!topicDevice.equals(t.deviceId())) return;
            Device d=devices.findById(t.deviceId()).orElseGet(() ->
                devices.save(new Device(t.deviceId(),t.deviceId(),"Unassigned")));
            d.setOnline(true); d.setLastSeen(Instant.now()); d.setRelayOn(t.relayOn());
            devices.save(d);
            readings.save(new Reading(d,t.temperature(),t.humidity(),t.relayOn(),
                t.recordedAt()==null?Instant.now():t.recordedAt()));
        } catch(Exception e) {
            System.err.println("Rejected telemetry: "+e.getMessage());
        }
    }

    public void publishCommand(String deviceId,boolean relayOn) {
        try {
            MqttClient current=client;
            if(current==null || !current.isConnected()) throw new IllegalStateException("MQTT broker unavailable");
            String json=mapper.writeValueAsString(Map.of("command","SET_RELAY","value",relayOn));
            MqttMessage msg=new MqttMessage(json.getBytes(StandardCharsets.UTF_8)); msg.setQos(1);
            current.publish("nexsense/devices/"+deviceId+"/command",msg);
        } catch(Exception e) { throw new IllegalStateException("Could not publish device command",e); }
    }

    @PreDestroy void close() {
        reconnect.shutdownNow();
        try { if(client!=null && client.isConnected()) client.disconnect(); } catch(Exception ignored) {}
        try { if(client!=null) client.close(); } catch(Exception ignored) {}
    }
}
