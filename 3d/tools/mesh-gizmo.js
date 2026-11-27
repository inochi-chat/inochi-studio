
import * as THREE from "three";

export function createMeshGizmo({
  scene,
  camera,
  renderer,
  mesh,
  topology
}) {
  if (!scene || !camera || !renderer || !mesh || !topology) {
    throw new Error("メッシュギズモの設定が不足しています。");
  }

  const group = new THREE.Group();
  scene.add(group);

  const directions = [
    {
      axis: "x",
      direction: new THREE.Vector3(1, 0, 0),
      color: 0xff4444
    },
    {
      axis: "y",
      direction: new THREE.Vector3(0, 1, 0),
      color: 0x44dd66
    },
    {
      axis: "z",
      direction: new THREE.Vector3(0, 0, 1),
      color: 0x4488ff
    }
  ];

  const arrows = [];

  for (const item of directions) {
    const arrow = new THREE.ArrowHelper(
      item.direction,
      new THREE.Vector3(0, 0, 0),
      1,
      item.color,
      0.22,
      0.12
    );

    group.add(arrow);
    arrows.push(arrow);
  }

  group.visible = false;

  function getArrowLength(center) {
    if (camera.isPerspectiveCamera) {
      const distance = camera.position.distanceTo(center);
      return Math.max(0.3, distance * 0.18);
    }

    if (camera.isOrthographicCamera) {
      return Math.max(0.3, (camera.top - camera.bottom) * 0.15);
    }

    return 1;
  }

  function update(vertexIds = []) {
    if (!vertexIds.length) {
      group.visible = false;
      return;
    }

    mesh.updateWorldMatrix(true, false);

    const center = new THREE.Vector3();
    let count = 0;

    for (const id of vertexIds) {
      const vertex = topology.getVertex(id);

      if (!vertex) continue;

      const worldPosition = mesh.localToWorld(
        new THREE.Vector3(
          vertex.position.x,
          vertex.position.y,
          vertex.position.z
        )
      );

      center.add(worldPosition);
      count++;
    }

    if (count === 0) {
      group.visible = false;
      return;
    }

    center.divideScalar(count);

    group.position.copy(center);
    group.quaternion.identity();

    const length = getArrowLength(center);

    for (const arrow of arrows) {
      arrow.setLength(
        length,
        length * 0.22,
        length * 0.12
      );
    }

    group.visible = true;
  }

  function dispose() {
    scene.remove(group);

    for (const arrow of arrows) {
      arrow.line.geometry.dispose();
      arrow.cone.geometry.dispose();

      arrow.line.material.dispose();
      arrow.cone.material.dispose();
    }
  }

  return {
    update,
    dispose
  };
}
