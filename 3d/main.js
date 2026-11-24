
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/TransformControls.js";

const canvas = document.querySelector("#threeCanvas");

if (!canvas) {
  throw new Error("threeCanvas が見つかりません");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x17152b);

const camera = new THREE.PerspectiveCamera(
  50,
  1,
  0.1,
  1000
);
camera.position.set(6, 5, 8);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;

const transform = new TransformControls(camera, renderer.domElement);
scene.add(transform.getHelper());

transform.addEventListener("dragging-changed", (event) => {
  orbit.enabled = !event.value;
});

scene.add(new THREE.GridHelper(20, 20, 0x8877cc, 0x39334f));
scene.add(new THREE.AxesHelper(2));

const ambient = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambient);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 10, 7);
light.castShadow = true;
scene.add(light);

const objects = [];
let selectedObject = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function addObject(geometry, name) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x9b83ff,
    roughness: 0.55,
    metalness: 0.05
  });

  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.y = geometry.parameters?.radius ? 1 : 0.5;
  object.castShadow = true;
  object.receiveShadow = true;

  scene.add(object);
  objects.push(object);
  selectObject(object);
  updateObjectList();
}

function addCube() {
  addObject(
    new THREE.BoxGeometry(1, 1, 1),
    "Cube"
  );
}

function addSphere() {
  addObject(
    new THREE.SphereGeometry(0.7, 32, 24),
    "Sphere"
  );
}

function addCylinder() {
  addObject(
    new THREE.CylinderGeometry(0.6, 0.6, 1.5, 32),
    "Cylinder"
  );
}

function selectObject(object) {
  selectedObject = object;

  if (object) {
    transform.attach(object);
  } else {
    transform.detach();
  }

  updateObjectList();
}

function updateObjectList() {
  const list = document.querySelector("#objectList");
  if (!list) return;

  list.innerHTML = "";

  objects.forEach((object, index) => {
    const item = document.createElement("button");
    item.className = "object-item";
    item.textContent = object.name + " " + (index + 1);

    if (object === selectedObject) {
      item.classList.add("selected");
    }

    item.addEventListener("click", () => {
      selectObject(object);
    });

    list.appendChild(item);
  });
}

function selectAtPointer(event) {
  if (transform.dragging) return;

  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(objects, false);

  if (hits.length > 0) {
    selectObject(hits[0].object);
  } else {
    selectObject(null);
  }
}

renderer.domElement.addEventListener("pointerdown", selectAtPointer);

document.querySelector("#addCube")?.addEventListener("click", addCube);
document.querySelector("#addSphere")?.addEventListener("click", addSphere);
document.querySelector("#addCylinder")?.addEventListener("click", addCylinder);

document.querySelector("#moveTool")?.addEventListener("click", () => {
  transform.setMode("translate");
});

document.querySelector("#rotateTool")?.addEventListener("click", () => {
  transform.setMode("rotate");
});

document.querySelector("#scaleTool")?.addEventListener("click", () => {
  transform.setMode("scale");
});

document.querySelector("#deleteObject")?.addEventListener("click", () => {
  if (!selectedObject) return;

  transform.detach();
  scene.remove(selectedObject);

  selectedObject.geometry.dispose();
  selectedObject.material.dispose();

  objects.splice(objects.indexOf(selectedObject), 1);
  selectedObject = null;

  updateObjectList();
});

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (!width || !height) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

window.addEventListener("resize", resize);
resize();

function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  renderer.render(scene, camera);
}

animate();

addCube();

console.log("Inochi Studio 3D Editor Ready");
