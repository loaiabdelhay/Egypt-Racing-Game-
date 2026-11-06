import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

document.body.classList.add("not-started");
const introScreen = document.getElementById("introScreen");
document.getElementById("startBtn").addEventListener("click", () => {
  document.body.classList.remove("not-started");
  introScreen.classList.add("hidden");
  setTimeout(() => introScreen.remove(), 700);
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc6dc);
scene.fog = new THREE.Fog(0x9bc6dc, 100, 650);

const camera = new THREE.PerspectiveCamera(68, innerWidth/innerHeight, 0.1, 1200);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd9edff, 0x75604b, 2.0));
const sun = new THREE.DirectionalLight(0xffe1b0, 3.0);
sun.position.set(-80, 130, 60); sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048); scene.add(sun);

const mat = (color, roughness=.8, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const asphalt = mat(0x34383a), sand = mat(0xc6ad86), concrete = mat(0x9a9387), white = mat(0xf4e9d5);
const dark = mat(0x17232b,.35), glass = new THREE.MeshStandardMaterial({color:0x294b5a,metalness:.35,roughness:.18});
const road = new THREE.Mesh(new THREE.PlaneGeometry(34,900),asphalt); road.rotation.x=-Math.PI/2; road.position.y=.02; scene.add(road);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),sand); ground.rotation.x=-Math.PI/2; ground.position.y=-.18; scene.add(ground);

function box(w,h,d,material,x,y,z,parent=scene){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
// Long Cairo-style avenue, lane markings, sidewalks and street lamps.
for(let z=-440;z<460;z+=18){
  box(.22,.035,7,white,0,.06,z);
  for(const x of [-17.5,17.5]) box(1,.3,18,concrete,x,.05,z);
}
for(let z=-430;z<450;z+=34){
  for(const side of [-1,1]){
    const x=side*24;
    box(1,8+Math.random()*17,22,concrete,x,4,z);
    const floors=3+Math.floor(Math.random()*5);
    for(let f=0;f<floors;f++) for(let wx=-1;wx<=1;wx++){
      const win=box(1.2,1.1,.12,mat([0x354d59,0x5e777b,0x8d7655][Math.floor(Math.random()*3)]),x+wx*5,2.5+f*3,z+11.12);
      win.castShadow=false;
    }
    // Rooftop water tank / satellite details
    if(Math.random()>.55) box(2,2,2,dark,x,10+Math.random()*12,z);
  }
}
for(const x of [-10,10]){
  for(let z=-420;z<440;z+=45){
    box(.18,5,.18,dark,x,2.5,z);
    const lamp= new THREE.Mesh(new THREE.BoxGeometry(1.5,.15,.35),mat(0xffe3a1,.3));lamp.position.set(x,5,z);scene.add(lamp);
  }
}
// Landmark-inspired distant Cairo skyline and a simple Nile-side blue strip.
const nile = new THREE.Mesh(new THREE.PlaneGeometry(95,900),mat(0x397f9a,.25,.15));
nile.rotation.x=-Math.PI/2;nile.position.set(105,-.12,0);scene.add(nile);
for(let i=0;i<28;i++){
  const h=18+Math.random()*48;
  const b=box(12,h,16,mat(0xaaa18e),-65+Math.random()*30,h/2,-420+i*32);
}
const tower= new THREE.Mesh(new THREE.CylinderGeometry(1.3,5,42,12),mat(0x777b7d));tower.position.set(0,21,-390);scene.add(tower);

// Player car: stylized detailed sports coupe.
const car = new THREE.Group(); scene.add(car);
const body=box(2.15,.62,4.2,mat(0xc51f2d,.28,.55),0,.78,0,car);
box(1.65,.72,1.9,glass,0,1.35,-.15,car);
box(1.8,.12,1.1,mat(0x9f1724,.25,.5),0,1.05,1.45,car);
for(const x of [-1.08,1.08]) for(const z of [-1.35,1.35]){
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.28,20),dark);
  wheel.rotation.z=Math.PI/2;wheel.position.set(x,.48,z);car.add(wheel);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.3,16),mat(0x9da5aa,.25,.8));
  hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);car.add(hub);
}
for(const x of [-.72,.72]){
  box(.42,.18,.08,mat(0xfff2cf,.2),x,.83,-2.12,car);
  box(.42,.16,.08,mat(0x9b1019),x,.8,2.12,car);
}
car.position.set(0,0,0);

// Ambient traffic cars moving along the avenue.
const traffic=[];
for(let i=0;i<12;i++){
  const g=new THREE.Group();scene.add(g);
  const colors=[0xe5e0d5,0x1e5d8a,0x18734b,0xc7a42d,0xeeeeee];
  box(1.8,.65,3.5,mat(colors[i%colors.length],.4,.25),0,.7,0,g);
  box(1.45,.6,1.5,glass,0,1.25,-.1,g);
  g.position.set((i%2? -5:5),0,-380+i*68);g.userData.speed=8+Math.random()*9;traffic.push(g);
}

let speed=0, heading=0, cameraMode=0;
const keys={}; let last=performance.now();
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==="c")toggleCamera();});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
document.querySelectorAll("[data-key]").forEach(btn=>{
  const k=btn.dataset.key;
  const down=e=>{e.preventDefault();keys[k]=true},up=e=>{e.preventDefault();keys[k]=false};
  btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);btn.addEventListener("pointerleave",up);btn.addEventListener("pointercancel",up);
});
function toggleCamera(){cameraMode=(cameraMode+1)%2;document.getElementById("cameraBtn").textContent=cameraMode?"كاميرا داخلية":"كاميرا خلفية";}
document.getElementById("cameraBtn").onclick=toggleCamera;

let socket=null,myId=null,remote={};
document.getElementById("multiBtn").onclick=()=>{
  if(socket?.readyState===1){socket.close();socket=null;document.getElementById("connection").textContent="وضع فردي";return;}
  const protocol=location.protocol==="https:"?"wss":"ws";
  socket=new WebSocket(`${protocol}://${location.host}/multiplayer`);
  socket.onopen=()=>document.getElementById("connection").textContent="متصل أونلاين";
  socket.onmessage=e=>{
    const data=JSON.parse(e.data);
    if(data.type==="welcome"){myId=data.id;data.players.forEach(p=>{if(p.id!==myId)remote[p.id]=p;});}
    if(data.type==="players"){remote={};data.players.forEach(p=>{if(p.id!==myId)remote[p.id]=p;});}
  };
  socket.onclose=()=>document.getElementById("connection").textContent="وضع فردي";
};

function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-last)/1000,.04);last=now;
  const forward=keys["arrowup"]||keys["w"], reverse=keys["arrowdown"]||keys["s"];
  const left=keys["arrowleft"]||keys["a"], right=keys["arrowright"]||keys["d"];
  if(forward)speed=Math.min(speed+27*dt,58); else if(reverse)speed=Math.max(speed-48*dt,-12); else speed*=Math.pow(.985,dt*60);
  if(left)heading+=dt*(1.5+Math.abs(speed)*.018);if(right)heading-=dt*(1.5+Math.abs(speed)*.018);
  car.rotation.y=heading;
  car.position.x-=Math.sin(heading)*speed*dt;
  car.position.z-=Math.cos(heading)*speed*dt;
  car.position.x=THREE.MathUtils.clamp(car.position.x,-13,13);
  traffic.forEach(t=>{t.position.z+=t.userData.speed*dt;if(t.position.z>car.position.z+80)t.position.z=car.position.z-500;});
  document.getElementById("speed").textContent=Math.round(Math.abs(speed)*3.6);
  if(socket?.readyState===1)socket.send(JSON.stringify({type:"state",x:car.position.x,z:car.position.z,heading}));

  // Follow camera or cockpit view.
  if(cameraMode===0){
    const offset=new THREE.Vector3(0,6.5,12).applyAxisAngle(new THREE.Vector3(0,1,0),heading);
    const target=car.position.clone().add(offset);
    camera.position.lerp(target,1-Math.pow(.001,dt));
    camera.lookAt(car.position.x,car.position.y+1.1,car.position.z-4*Math.cos(heading));
  }else{
    const eye=new THREE.Vector3(0,1.55,-.15).applyAxisAngle(new THREE.Vector3(0,1,0),heading).add(car.position);
    camera.position.copy(eye);
    const look=new THREE.Vector3(-Math.sin(heading),1.35,-Math.cos(heading)).add(car.position);
    camera.lookAt(look);
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));});
setTimeout(()=>{const t=document.getElementById("toast");t.style.opacity=0;},4500);
