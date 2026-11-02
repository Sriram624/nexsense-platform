import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View, Pressable, RefreshControl } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';
type Tab = 'Home'|'Devices'|'Dashboards'|'Automations'|'Activity'|'Settings';
type Device = { id:string; name:string; location:string; online:boolean; relayOn:boolean; lastSeen?:string };
type Reading = { id:number; temperature:number; humidity:number; relayOn:boolean; recordedAt:string };
type Insight = { anomaly:boolean; latestTemperature?:number; meanTemperature?:number; samples:number; message:string };
let authToken:string|null=null;

async function api<T>(path:string, init:RequestInit={}):Promise<T>{
  const headers:Record<string,string>={'Content-Type':'application/json'};
  if(authToken) headers.Authorization=`Bearer ${authToken}`;
  const r=await fetch(`${API}${path}`,{...init,headers:{...headers,...(init.headers as Record<string,string>||{})}});
  if(!r.ok) throw new Error((await r.text())||`HTTP ${r.status}`);
  if(r.status===204) return undefined as T;
  return r.json() as Promise<T>;
}

export default function App(){
  const [email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [authenticated,setAuthenticated]=useState(false),[busy,setBusy]=useState(false);
  const [tab,setTab]=useState<Tab>('Home'),[devices,setDevices]=useState<Device[]>([]);
  const [readings,setReadings]=useState<Reading[]>([]),[insight,setInsight]=useState<Insight|null>(null);
  const [error,setError]=useState(''),[refreshing,setRefreshing]=useState(false);
  const [newDeviceId,setNewDeviceId]=useState(''),[newDeviceName,setNewDeviceName]=useState(''),[newDeviceLocation,setNewDeviceLocation]=useState('');
  const [ruleName,setRuleName]=useState(''),[ruleThreshold,setRuleThreshold]=useState('35');

  const load=useCallback(async()=>{
    try{
      setError('');
      const ds=await api<Device[]>('/api/devices');setDevices(ds);
      if(ds.length){
        const id=encodeURIComponent(ds[0].id);
        const [rs,ins]=await Promise.all([api<Reading[]>(`/api/devices/${id}/readings`),api<Insight>(`/api/devices/${id}/insights`)]);
        setReadings(rs);setInsight(ins);
      }else{setReadings([]);setInsight(null);}
    }catch(e){setError(e instanceof Error?e.message:'Unable to load data');}
    finally{setRefreshing(false);}
  },[]);

  useEffect(()=>{(async()=>{authToken=await SecureStore.getItemAsync('nexsense_token');if(authToken)setAuthenticated(true);})();},[]);
  useEffect(()=>{if(!authenticated)return;load();const t=setInterval(load,5000);return()=>clearInterval(t);},[authenticated,load]);

  const auth=async(mode:'login'|'register')=>{
    setBusy(true);setError('');
    try{
      const r=await api<{token:string}>('/api/auth/'+mode,{method:'POST',body:JSON.stringify({email,password})});
      authToken=r.token;await SecureStore.setItemAsync('nexsense_token',r.token);setAuthenticated(true);
    }catch(e){setError(e instanceof Error?e.message:'Authentication failed');}finally{setBusy(false);}
  };
  const logout=async()=>{authToken=null;await SecureStore.deleteItemAsync('nexsense_token');setAuthenticated(false);setDevices([]);setReadings([]);setTab('Home');};
  const relay=async(d:Device,on:boolean)=>{
    try{await api(`/api/devices/${encodeURIComponent(d.id)}/relay`,{method:'POST',body:JSON.stringify({on})});Alert.alert('Command published','MQTT publish accepted. Confirm physical execution from device telemetry.');}
    catch(e){Alert.alert('Command failed',e instanceof Error?e.message:'MQTT unavailable');}
  };
  const addDevice=async()=>{
    try{
      await api('/api/devices',{method:'POST',body:JSON.stringify({id:newDeviceId.trim(),name:newDeviceName.trim(),location:newDeviceLocation.trim()})});
      setNewDeviceId('');setNewDeviceName('');setNewDeviceLocation('');await load();Alert.alert('Device added','Device record created. Connect firmware using the matching device ID.');
    }catch(e){Alert.alert('Could not add device',e instanceof Error?e.message:'Request failed');}
  };
  const createRuleDraft=()=>{
    Alert.alert('Automation setup','The automation designer is included as a product module, but rule persistence, scheduling and safe execution are not connected in this build. Do not rely on this draft to control real equipment.');
  };

  if(!authenticated)return <SafeAreaView style={s.safe}><StatusBar barStyle="light-content"/><View style={s.login}>
    <Text style={s.brand}>NEXSENSE PLATFORM</Text><Text style={s.hero}>Your connected world.</Text>
    <Text style={s.muted}>Sign in or create your development account.</Text>
    <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor="#71818B" autoCapitalize="none" keyboardType="email-address" style={s.input}/>
    <TextInput value={password} onChangeText={setPassword} placeholder="Password (10+ characters)" placeholderTextColor="#71818B" secureTextEntry style={s.input}/>
    {!!error&&<Text style={s.error}>{error}</Text>}
    <Pressable style={s.primary} disabled={busy} onPress={()=>auth('login')}><Text style={s.primaryText}>{busy?'Please wait':'Sign in'}</Text></Pressable>
    <Pressable style={s.secondary} disabled={busy} onPress={()=>auth('register')}><Text style={s.secondaryText}>Create account</Text></Pressable>
  </View></SafeAreaView>;

  return <SafeAreaView style={s.safe}><StatusBar barStyle="light-content"/>
    <View style={s.top}><View><Text style={s.brand}>NEXSENSE</Text><Text style={s.topTitle}>{tab}</Text></View><View style={s.live}><View style={s.dot}/><Text style={s.liveText}>PLATFORM</Text></View></View>
    {!!error&&<View style={s.errorBox}><Text style={s.error}>{error}</Text></View>}
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} tintColor="#70E0C3"/>}>
      {tab==='Home'&&<Home devices={devices} latest={readings[0]} insight={insight} onRelay={relay} onNavigate={setTab}/>}
      {tab==='Devices'&&<Devices devices={devices} onRelay={relay} id={newDeviceId} setId={setNewDeviceId} name={newDeviceName} setName={setNewDeviceName} location={newDeviceLocation} setLocation={setNewDeviceLocation} onAdd={addDevice}/>}
      {tab==='Dashboards'&&<Dashboards readings={readings}/>}
      {tab==='Automations'&&<Automations name={ruleName} setName={setRuleName} threshold={ruleThreshold} setThreshold={setRuleThreshold} onCreate={createRuleDraft}/>}
      {tab==='Activity'&&<Activity readings={readings} devices={devices}/>}
      {tab==='Settings'&&<Settings email={email} onLogout={logout}/>}
    </ScrollView>
    <View style={s.nav}>{(['Home','Devices','Dashboards','Automations','Activity','Settings'] as Tab[]).map(x=><Pressable key={x} onPress={()=>setTab(x)} style={s.navItem}><Text style={[s.navText,tab===x&&s.navActive]}>{x}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

function Home({devices,latest,insight,onRelay,onNavigate}:{devices:Device[];latest?:Reading;insight:Insight|null;onRelay:(d:Device,v:boolean)=>void;onNavigate:(t:Tab)=>void}){
  return <>
    <View style={s.heroBlock}><Text style={s.heroSmall}>SYSTEM OVERVIEW</Text><Text style={s.hero}>Monitor everything.</Text><Text style={s.muted}>Your devices, telemetry and automations in one place.</Text></View>
    <View style={s.stats}><Metric label="DEVICES" value={`${devices.length}`}/><Metric label="ONLINE" value={`${devices.filter(d=>d.online).length}`}/></View>
    <View style={s.stats}><Metric label="TEMPERATURE" value={latest?`${latest.temperature.toFixed(1)}°`:'—'}/><Metric label="HUMIDITY" value={latest?`${latest.humidity.toFixed(1)}%`:'—'}/></View>
    <Section title="DEVICE HEALTH"/>
    {devices.slice(0,3).map(d=><View style={s.card} key={d.id}><View style={s.row}><View style={{flex:1}}><Text style={s.cardTitle}>{d.name}</Text><Text style={s.muted}>{d.id} · {d.location}</Text></View><Text style={{color:d.online?'#70E0C3':'#F2B36D',fontWeight:'800'}}>{d.online?'ONLINE':'OFFLINE'}</Text></View><View style={s.line}/><View style={s.row}><Text style={s.body}>Relay output</Text><Switch value={d.relayOn} onValueChange={v=>onRelay(d,v)}/></View></View>)}
    {!devices.length&&<Empty title="No devices connected" body="Register a device to start receiving sensor data." action="Open Devices" onPress={()=>onNavigate('Devices')}/>}
    <Section title="INTELLIGENCE"/>
    <View style={s.card}><Text style={{color:insight?.anomaly?'#F2B36D':'#70E0C3',fontWeight:'900'}}>{insight?.anomaly?'ANOMALY DETECTED':'STATISTICAL HEALTH CHECK'}</Text><Text style={s.body}>{insight?.message||'Waiting for telemetry.'}</Text><Text style={s.muted}>{insight?.samples??0} samples analysed</Text></View>
    <View style={s.quickGrid}>{(['Dashboards','Automations','Activity'] as Tab[]).map(t=><Pressable key={t} onPress={()=>onNavigate(t)} style={s.quick}><Text style={s.quickText}>{t} →</Text></Pressable>)}</View>
  </>;
}
function Devices({devices,onRelay,id,setId,name,setName,location,setLocation,onAdd}:{devices:Device[];onRelay:(d:Device,v:boolean)=>void;id:string;setId:(v:string)=>void;name:string;setName:(v:string)=>void;location:string;setLocation:(v:string)=>void;onAdd:()=>void}){
  return <>
    <Section title="REGISTERED DEVICES"/>{devices.map(d=><View style={s.card} key={d.id}><View style={s.row}><View style={{flex:1}}><Text style={s.cardTitle}>{d.name}</Text><Text style={s.muted}>{d.id} · {d.location}</Text></View><Text style={s.muted}>{d.online?'ONLINE':'OFFLINE'}</Text></View><View style={s.line}/><View style={s.row}><Text style={s.body}>Relay</Text><Switch value={d.relayOn} onValueChange={v=>onRelay(d,v)}/></View></View>)}
    <Section title="ADD A DEVICE"/><View style={s.card}><Text style={s.muted}>Create a device identity. Firmware must publish telemetry using the same ID.</Text>
      <Field label="Device ID" value={id} onChange={setId} placeholder="ESP32-002"/><Field label="Display name" value={name} onChange={setName} placeholder="Greenhouse sensor"/><Field label="Location" value={location} onChange={setLocation} placeholder="Greenhouse"/>
      <Pressable style={s.primary} onPress={onAdd}><Text style={s.primaryText}>Register device</Text></Pressable>
      <Text style={s.note}>QR/Bluetooth provisioning is a planned integration; this screen currently registers by ID through the API.</Text>
    </View>
  </>;
}
function Dashboards({readings}:{readings:Reading[]}){
  const values=readings.slice(0,12).reverse();const temps=values.map(x=>x.temperature);const min=Math.min(...temps,0),max=Math.max(...temps,1);
  return <>
    <Text style={s.muted}>DEFAULT SENSOR DASHBOARD · First registered device</Text>
    <View style={s.stats}><Metric label="SAMPLES" value={`${readings.length}`}/><Metric label="LATEST TEMP" value={readings[0]?`${readings[0].temperature.toFixed(1)}°C`:'—'}/></View>
    <Section title="TEMPERATURE HISTORY"/><View style={s.card}>{values.map(r=><View key={r.id} style={s.chartRow}><Text style={s.chartLabel}>{new Date(r.recordedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</Text><View style={s.chartTrack}><View style={[s.chartBar,{width:`${max===min?50:15+(r.temperature-min)/(max-min)*85}%` as `${number}%`}]}/></View><Text style={s.chartValue}>{r.temperature.toFixed(1)}°</Text></View>)}{!values.length&&<Text style={s.muted}>Charts populate after telemetry arrives.</Text>}</View>
    <Section title="WIDGET LIBRARY"/><View style={s.quickGrid}>{['Value card','Gauge','Line chart','Switch','Status indicator','Event feed'].map(x=><View key={x} style={s.quick}><Text style={s.quickText}>{x}</Text></View>)}</View>
    <Text style={s.note}>The widget catalogue is a UI foundation. Drag-and-drop layout editing, saved dashboard layouts and per-widget data bindings still need implementation.</Text>
  </>;
}
function Automations({name,setName,threshold,setThreshold,onCreate}:{name:string;setName:(v:string)=>void;threshold:string;setThreshold:(v:string)=>void;onCreate:()=>void}){
  return <>
    <Text style={s.muted}>Build event-driven logic for your connected devices.</Text>
    <Section title="RULE DESIGNER"/><View style={s.card}>
      <Field label="Automation name" value={name} onChange={setName} placeholder="High temperature alert"/>
      <Text style={s.fieldLabel}>WHEN</Text><View style={s.ruleStep}><Text style={s.ruleText}>Temperature exceeds threshold</Text></View>
      <Field label="Threshold (°C)" value={threshold} onChange={setThreshold} placeholder="35"/>
      <Text style={s.fieldLabel}>THEN</Text><View style={s.ruleStep}><Text style={s.ruleText}>Send alert / trigger device action</Text></View>
      <Pressable style={s.primary} onPress={onCreate}><Text style={s.primaryText}>Continue rule setup</Text></Pressable>
    </View>
    <Text style={s.note}>Rule persistence, scheduler, action executor, safety interlocks and audit history are not yet connected. This designer is not an active automation engine.</Text>
    <Section title="FUTURE TRIGGERS"/><View style={s.quickGrid}>{['Sensor threshold','Device state','Time schedule','Device offline','Anomaly detected','Webhook event'].map(x=><View key={x} style={s.quick}><Text style={s.quickText}>{x}</Text></View>)}</View>
  </>;
}
function Activity({readings,devices}:{readings:Reading[];devices:Device[]}){
  return <><Section title="DEVICE EVENTS"/><View style={s.card}><Text style={s.cardTitle}>Current fleet status</Text><Text style={s.body}>{devices.filter(d=>d.online).length} online · {devices.filter(d=>!d.online).length} offline</Text></View><Section title="RECENT TELEMETRY"/>{readings.slice(0,20).map(r=><View key={r.id} style={s.event}><View style={s.dot}/><View style={{flex:1}}><Text style={s.body}>Sensor reading received</Text><Text style={s.muted}>{new Date(r.recordedAt).toLocaleString()}</Text></View><Text style={s.eventValue}>{r.temperature.toFixed(1)}°C</Text></View>)}{!readings.length&&<Text style={s.muted}>No events yet.</Text>}</>;
}
function Settings({email,onLogout}:{email:string;onLogout:()=>void}){
  return <><View style={s.card}><Text style={s.muted}>SIGNED IN AS</Text><Text style={s.cardTitle}>{email||'Account'}</Text></View><Section title="PLATFORM SETTINGS"/>{['Profile and account','Notification preferences','Theme and appearance','Device sharing','API and integrations','About NexSense'].map(x=><View key={x} style={s.settingRow}><Text style={s.body}>{x}</Text><Text style={s.muted}>›</Text></View>)}<Text style={s.note}>These settings screens require their corresponding backend services and permissions before use.</Text><Pressable style={s.secondary} onPress={onLogout}><Text style={s.secondaryText}>Sign out</Text></Pressable></>;
}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>;}
function Section({title}:{title:string}){return <Text style={s.section}>{title}</Text>;}
function Field({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder:string}){return <View><Text style={s.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#70818B" style={s.input}/></View>;}
function Empty({title,body,action,onPress}:{title:string;body:string;action:string;onPress:()=>void}){return <View style={s.card}><Text style={s.cardTitle}>{title}</Text><Text style={s.muted}>{body}</Text><Pressable onPress={onPress} style={s.secondary}><Text style={s.secondaryText}>{action}</Text></Pressable></View>;}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#0A1118'},login:{flex:1,justifyContent:'center',padding:25},
 top:{paddingHorizontal:20,paddingTop:14,paddingBottom:13,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderBottomWidth:1,borderBottomColor:'#1E2B34'},
 brand:{color:'#70E0C3',fontSize:10,fontWeight:'900',letterSpacing:2.2},topTitle:{color:'#F1F5F6',fontSize:23,fontWeight:'900',marginTop:4},
 live:{backgroundColor:'#142C2A',paddingHorizontal:10,paddingVertical:8,borderRadius:20,flexDirection:'row',alignItems:'center',gap:6},
 liveText:{color:'#BDEDE1',fontSize:9,fontWeight:'900'},dot:{width:7,height:7,borderRadius:5,backgroundColor:'#70E0C3'},
 content:{padding:18,paddingBottom:30},heroBlock:{paddingVertical:12},hero:{fontSize:29,color:'#F1F5F6',fontWeight:'900',marginTop:7},heroSmall:{color:'#70E0C3',fontSize:10,letterSpacing:2,fontWeight:'900'},
 muted:{color:'#81919B',fontSize:11,marginTop:5},section:{color:'#91A1AA',fontSize:10,letterSpacing:1.7,fontWeight:'900',marginTop:20,marginBottom:11},
 stats:{flexDirection:'row',gap:10,marginTop:10},metric:{flex:1,backgroundColor:'#151F28',borderColor:'#26343E',borderWidth:1,borderRadius:14,padding:14},
 metricLabel:{color:'#90A0AA',fontSize:9,letterSpacing:1,fontWeight:'800'},metricValue:{color:'#F2F6F7',fontSize:24,fontWeight:'900',marginTop:9},
 card:{backgroundColor:'#141F28',borderColor:'#273640',borderWidth:1,borderRadius:15,padding:15,marginBottom:10},
 row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10},cardTitle:{color:'#F1F5F6',fontSize:14,fontWeight:'800'},body:{color:'#E3EAED',fontSize:12,fontWeight:'600',marginTop:5},
 line:{height:1,backgroundColor:'#293740',marginVertical:13},primary:{backgroundColor:'#70E0C3',borderRadius:11,padding:13,alignItems:'center',marginTop:13},
 primaryText:{color:'#0A1716',fontWeight:'900'},secondary:{padding:12,alignItems:'center'},secondaryText:{color:'#70E0C3',fontWeight:'800'},
 input:{backgroundColor:'#0E1820',borderColor:'#2A3943',borderWidth:1,borderRadius:10,padding:12,color:'#F1F5F6',marginTop:6,marginBottom:9},
 fieldLabel:{color:'#A7B4BA',fontSize:10,fontWeight:'800',marginTop:12,letterSpacing:.8},note:{color:'#E0B778',fontSize:10,lineHeight:16,marginVertical:12},
 chartRow:{flexDirection:'row',alignItems:'center',gap:8,marginVertical:5},chartLabel:{color:'#81919B',fontSize:9,width:43},chartTrack:{flex:1,height:7,backgroundColor:'#2A3943',borderRadius:8,overflow:'hidden'},chartBar:{height:7,backgroundColor:'#70E0C3',borderRadius:8},chartValue:{color:'#EAF0F2',fontSize:10,width:38,textAlign:'right'},
 quickGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},quick:{backgroundColor:'#172630',borderColor:'#2A3B45',borderWidth:1,padding:12,borderRadius:11,minWidth:'30%',flexGrow:1},quickText:{color:'#D7E2E6',fontSize:11,fontWeight:'700'},
 ruleStep:{backgroundColor:'#1B3036',padding:12,borderRadius:10,marginTop:7},ruleText:{color:'#C8E9E4',fontSize:12,fontWeight:'700'},
 event:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#23313A'},eventValue:{color:'#70E0C3',fontWeight:'800',fontSize:11},
 settingRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:15,borderBottomWidth:1,borderBottomColor:'#23313A'},
 nav:{flexDirection:'row',justifyContent:'space-around',backgroundColor:'#101A22',borderTopWidth:1,borderTopColor:'#26343D',paddingVertical:11},
 navItem:{paddingHorizontal:3},navText:{color:'#71828D',fontSize:9,fontWeight:'800'},navActive:{color:'#70E0C3'},
 login:{flex:1,justifyContent:'center',padding:25},error:{color:'#FFB4B4',fontSize:11,marginTop:8},errorBox:{backgroundColor:'#3A2424',padding:10,marginHorizontal:18,borderRadius:9}
});
