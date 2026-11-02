package com.nexsense.api;

import com.nexsense.device.*;
import com.nexsense.reading.*;
import com.nexsense.mqtt.MqttService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final DeviceRepository devices;
    private final ReadingRepository readings;
    private final MqttService mqtt;
    public ApiController(DeviceRepository d,ReadingRepository r,MqttService m) {
        devices=d; readings=r; mqtt=m;
    }

    @GetMapping("/health")
    public Map<String,Object> health() {
        return Map.of("status","UP","service","nexsense-api","time",Instant.now());
    }

    @GetMapping("/devices")
    public List<Map<String,Object>> allDevices() {
        return devices.findAll().stream().map(this::deviceDto).toList();
    }

    @PostMapping("/devices")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> create(@Valid @RequestBody CreateDevice request) {
        if(devices.existsById(request.id())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Device already exists");
        return deviceDto(devices.save(new Device(request.id(),request.name(),request.location())));
    }

    @GetMapping("/devices/{id}/readings")
    public List<Map<String,Object>> deviceReadings(@PathVariable String id) {
        if(!devices.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Device not found");
        return readings.findTop100ByDevice_IdOrderByRecordedAtDesc(id).stream().map(this::readingDto).toList();
    }

    @GetMapping("/devices/{id}/insights")
    public Map<String,Object> insights(@PathVariable String id) {
        List<Reading> history=readings.findTop100ByDevice_IdOrderByRecordedAtDesc(id);
        if(history.isEmpty()) return Map.of("anomaly",false,"message","Not enough data yet","samples",0);
        double[] values=history.stream().mapToDouble(Reading::getTemperature).toArray();
        double mean=Arrays.stream(values).average().orElse(0);
        double variance=Arrays.stream(values).map(v -> Math.pow(v-mean,2)).average().orElse(0);
        double std=Math.sqrt(variance);
        double latest=values[0];
        boolean anomaly=history.size()>=8 && std>0 && Math.abs(latest-mean)>2.5*std;
        return Map.of("anomaly",anomaly,"latestTemperature",latest,"meanTemperature",mean,
            "standardDeviation",std,"samples",history.size(),
            "message",anomaly?"Unusual temperature reading detected":"No statistical temperature anomaly detected");
    }

    @PostMapping("/devices/{id}/relay")
    public Map<String,Object> setRelay(@PathVariable String id,@RequestBody RelayRequest request) {
        if(!devices.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Device not found");
        mqtt.publishCommand(id,request.on());
        return Map.of("accepted",true,"deviceId",id,"requestedRelayState",request.on(),
            "message","Published to MQTT; this is not confirmation that the device executed it");
    }

    private Map<String,Object> deviceDto(Device d) {
        Map<String,Object> m=new LinkedHashMap<>();
        m.put("id",d.getId()); m.put("name",d.getName()); m.put("location",d.getLocation());
        m.put("online",d.isOnline()); m.put("relayOn",d.isRelayOn()); m.put("lastSeen",d.getLastSeen()); return m;
    }
    private Map<String,Object> readingDto(Reading r) {
        Map<String,Object> m=new LinkedHashMap<>();
        m.put("id",r.getId()); m.put("deviceId",r.getDeviceId()); m.put("temperature",r.getTemperature());
        m.put("humidity",r.getHumidity()); m.put("relayOn",r.isRelayOn()); m.put("recordedAt",r.getRecordedAt()); return m;
    }
    public record CreateDevice(@NotBlank String id,@NotBlank String name,@NotBlank String location) {}
    public record RelayRequest(boolean on) {}
}
