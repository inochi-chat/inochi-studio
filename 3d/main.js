
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

import { initializeEditor } from "./core/editor-init.js";
import { createGeometry } from "./objects/object-factory.js";

// ----------------------------------------
// 1. 3Dエディターの初期化
// ----------------------------------------

const canvas = document.querySelector("#threeCanvas");
const propertyPanel = document.querySelector("#propertyPanel");
const objectList = document.querySelector("#objectList");

if (!canvas || !propertyPanel || !objectList) {
  throw new Error("3DエディターのHTML要素が見つかりません");
}

const { scene, camera, renderer } = initializeEditor(canvas);

// ----------------------------------------
// 2. カメラ操作
// ----------------------------------------

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;

// ----------------------------------------
// 3. 変形ツール
// ----------------------------------------

const transform = new TransformControls(camera, renderer.domElement);
scene.add(transform.getHelper());

transform.addEventListener("dragging-changed", (event) => {
  orbit.enabled = !event.value;
});

transform.addEventListener("mouseUp", () => {
  refreshProperties();
});

// ----------------------------------------
// 4. オブジェクト管理
// ----------------------------------------

const objects = [];
let selectedObject = null;
let objectCounter = 0;

function addObject(geometry, type) {
  if (!geometry) return;

  objectCounter++;

  const material = new THREE.MeshStandardMaterial({
    color: 0x9b83ff,
    roughness: 0.55,
    metalness: 0.05
  });

  const object = new THREE.Mesh(geometry, material);

  object.name = `${type}_${objectCounter}`;
  object.position.y = 0.5;
  object.castShadow = true;
  object.receiveShadow = true;

  scene.add(object);
  objects.push(object);

  selectObject(object);
  updateObjectList();
}

function addCube() {
  addObject(createGeometry("cube"), "Cube");
}

function addSphere() {
  addObject(createGeometry("sphere"), "Sphere");
}

function addCylinder() {
  addObject(createGeometry("cylinder"), "Cylinder");
}

function deleteSelectedObject() {
  if (!selectedObject) return;

  transform.detach();
  scene.remove(selectedObject);

  selectedObject.geometry.dispose();

  if (Array.isArray(selectedObject.material)) {
    selectedObject.material.forEach((material) => material.dispose());
  } else {
    selectedObject.material.dispose();
  }

  objects.splice(objects.indexOf(selectedObject), 1);
  selectedObject = null;

  updateObjectList();
  refreshProperties();
}

// ----------------------------------------
// 5. オブジェクト選択
// ----------------------------------------

function selectObject(object) {
  selectedObject = object;

  if (object) {
    transform.attach(object);
  } else {
    transform.detach();
  }

  updateObjectList();
  refreshProperties();
}

function updateObjectList() {
  objectList.innerHTML = "";

  objects.forEach((object) => {
    const item = document.createElement("button");

    item.className = "object-item";
    item.textContent = object.name;

    if (object === selectedObject) {
      item.classList.add("selected");
    }

    item.addEventListener("click", () => {
      selectObject(object);
    });

    objectList.appendChild(item);
  });
}

// ----------------------------------------
// 6. プロパティ入力欄
// ----------------------------------------

function makeNumberInput(label, value, onChange) {
  const row = document.createElement("div");
  row.className = "property-row";

  const text = document.createElement("label");
  text.textContent = label;

  const input = document.createElement("input");
  input.type = "number";
  input.step = "0.1";
  input.value = Number(value.toFixed(2));

  input.addEventListener("change", () => {
    const number = Number(input.value);

    if (!Number.isFinite(number)) return;

    onChange(number);
    updateObjectList();
  });

  row.append(text, input);

  return row;
}

function makeGroup(title, vector, onChange, isRotation = false) {
  const group = document.createElement("div");
  group.className = "property-group";

  const heading = document.createElement("h3");
  heading.textContent = title;

  group.appendChild(heading);

  ["X", "Y", "Z"].forEach((axis, index) => {
    const key = axis.toLowerCase();
    const value = vector[key];

    const displayValue = isRotation
      ? THREE.MathUtils.radToDeg(value)
      : value;

    group.appendChild(
      makeNumberInput(axis, displayValue, (number) => {
        const converted = isRotation
          ? THREE.MathUtils.degToRad(number)
          : number;

        onChange(index, converted);
        refreshProperties();
      })
    );
  });

  return group;
}

function refreshProperties() {
  propertyPanel.innerHTML = "";

  if (!selectedObject) {
    const empty = document.createElement("p");

    empty.className = "empty";
    empty.textContent =
      "オブジェクトを選択すると、ここで詳細を編集できるよ。";

    propertyPanel.appendChild(empty);
    return;
  }

  const object = selectedObject;

  const inner = document.createElement("div");
  inner.className = "properties-inner";

  const nameHeading = document.createElement("h3");
  nameHeading.textContent = "名前";

  inner.appendChild(nameHeading);

  const nameInput = document.createElement("input");
  nameInput.className = "property-name";
  nameInput.value = object.name;

  nameInput.addEventListener("change", () => {
    const newName = nameInput.value.trim();

    if (newName) {
      object.name = newName;
      updateObjectList();
    } else {
      nameInput.value = object.name;
    }
  });

  inner.appendChild(nameInput);

  inner.appendChild(
    makeGroup("位置", object.position, (index, value) => {
      object.position.setComponent(index, value);
    })
  );

  inner.appendChild(
    makeGroup(
      "回転（度）",
      object.rotation,
      (index, value) => {
        object.rotation.setComponent(index, value);
      },
      true
    )
  );

  inner.appendChild(
    makeGroup("サイズ", object.scale, (index, value) => {
      object.scale.setComponent(index, value);
    })
  );

  const colorGroup = document.createElement("div");
  colorGroup.className = "property-group";

  const colorHeading = document.createElement("h3");
  colorHeading.textContent = "カラー";

  colorGroup.appendChild(colorHeading);

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = "#" + object.material.color.getHexString();

  colorInput.addEventListener("input", () => {
    object.material.color.set(colorInput.value);
  });

  colorGroup.appendChild(colorInput);
  inner.appendChild(colorGroup);

  propertyPanel.appendChild(inner);
}

// ----------------------------------------
// 7. 画面からオブジェクトを選択
// ----------------------------------------

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

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

// ----------------------------------------
// 8. ボタン接続
// ----------------------------------------

document.querySelector("#addCube")
  ?.addEventListener("click", addCube);

document.querySelector("#addSphere")
  ?.addEventListener("click", addSphere);

document.querySelector("#addCylinder")
  ?.addEventListener("click", addCylinder);

document.querySelector("#moveTool")
  ?.addEventListener("click", () => {
    transform.setMode("translate");
  });

document.querySelector("#rotateTool")
  ?.addEventListener("click", () => {
    transform.setMode("rotate");
  });

document.querySelector("#scaleTool")
  ?.addEventListener("click", () => {
    transform.setMode("scale");
  });

document.querySelector("#deleteObject")
  ?.addEventListener("click", deleteSelectedObject);

// ----------------------------------------
// 9. 描画ループ
// ----------------------------------------

function animate() {
  requestAnimationFrame(animate);

  orbit.update();
  renderer.render(scene, camera);
}

animate();

// ----------------------------------------
// 10. 初期オブジェクト
// ----------------------------------------

addCube();

console.log("Inochi Studio 3D Editor Ready");
