
export function createRotationDeformer(options = {}) {
  return {
    type: "rotation",

    x: options.x ?? 0,
    y: options.y ?? 0,

    rotation: options.rotation ?? 0,

    minRotation: options.minRotation ?? -180,
    maxRotation: options.maxRotation ?? 180,

    scaleX: options.scaleX ?? 1,
    scaleY: options.scaleY ?? 1,

    locked: false
  };
}

export function setRotation(deformer, rotation) {
  if (
    !deformer ||
    deformer.locked ||
    !Number.isFinite(rotation)
  ) {
    return false;
  }

  deformer.rotation = Math.max(
    deformer.minRotation,
    Math.min(deformer.maxRotation, rotation)
  );

  return true;
}

export function rotateBy(deformer, delta) {
  if (!deformer || !Number.isFinite(delta)) {
    return false;
  }

  return setRotation(
    deformer,
    deformer.rotation + delta
  );
}

export function setRotationCenter(deformer, x, y) {
  if (
    !deformer ||
    deformer.locked ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    return false;
  }

  deformer.x = x;
  deformer.y = y;

  return true;
}

export function setRotationLimits(
  deformer,
  minRotation,
  maxRotation
) {
  if (
    !deformer ||
    !Number.isFinite(minRotation) ||
    !Number.isFinite(maxRotation) ||
    minRotation > maxRotation
  ) {
    return false;
  }

  deformer.minRotation = minRotation;
  deformer.maxRotation = maxRotation;

  deformer.rotation = Math.max(
    minRotation,
    Math.min(maxRotation, deformer.rotation)
  );

  return true;
}

export function resetRotation(deformer) {
  if (!deformer || deformer.locked) {
    return false;
  }

  deformer.rotation = 0;

  return true;
}

export function setRotationLocked(deformer, locked) {
  if (!deformer) {
    return false;
  }

  deformer.locked = Boolean(locked);

  return true;
}

export function getRotationMatrix(deformer) {
  if (!deformer) {
    return null;
  }

  const radians = deformer.rotation * Math.PI / 180;

  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    a: cos,
    b: sin,
    c: -sin,
    d: cos,
    e: deformer.x,
    f: deformer.y
  };
}

export function rotatePoint(point, deformer) {
  if (!point || !deformer) {
    return null;
  }

  const radians = deformer.rotation * Math.PI / 180;

  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const deltaX = point.x - deformer.x;
  const deltaY = point.y - deformer.y;

  return {
    x: deformer.x + deltaX * cos - deltaY * sin,
    y: deformer.y + deltaX * sin + deltaY * cos
  };
}
