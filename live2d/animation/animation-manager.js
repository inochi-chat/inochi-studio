
export function initializeAnimationManager(state) {
  if (!Array.isArray(state.animations)) {
    state.animations = [];
  }

  state.animationManager = {
    nextId: 1,
    selectedAnimationId: null,
    currentTime: 0,
    duration: 5,
    playing: false,
    loop: true
  };

  console.log("Animation Manager: Ready");
}

export function createAnimation(state, options = {}) {
  const animation = {
    id: `animation_${state.animationManager.nextId++}`,
    name: options.name || "新しいアニメーション",

    duration: Math.max(0.1, options.duration ?? 5),
    frameRate: Math.max(1, options.frameRate ?? 30),

    loop: options.loop ?? true,

    tracks: [],

    createdAt: Date.now()
  };

  state.animations.push(animation);

  selectAnimation(state, animation.id);

  return animation;
}

export function getAnimationById(state, animationId) {
  return state.animations.find(
    animation => animation.id === animationId
  ) || null;
}

export function getAllAnimations(state) {
  return [...state.animations];
}

export function getSelectedAnimation(state) {
  return getAnimationById(
    state,
    state.animationManager.selectedAnimationId
  );
}

export function selectAnimation(state, animationId) {
  const animation = getAnimationById(state, animationId);

  if (!animation) {
    return false;
  }

  state.animationManager.selectedAnimationId = animationId;
  state.animationManager.duration = animation.duration;
  state.animationManager.currentTime = 0;

  return true;
}

export function removeAnimation(state, animationId) {
  const index = state.animations.findIndex(
    animation => animation.id === animationId
  );

  if (index === -1) {
    return false;
  }

  state.animations.splice(index, 1);

  if (state.animationManager.selectedAnimationId === animationId) {
    state.animationManager.selectedAnimationId =
      state.animations[0]?.id || null;
  }

  return true;
}

export function renameAnimation(state, animationId, newName) {
  const animation = getAnimationById(state, animationId);

  if (!animation || typeof newName !== "string") {
    return false;
  }

  const name = newName.trim();

  if (!name) {
    return false;
  }

  animation.name = name;

  return true;
}

export function setAnimationDuration(state, animationId, duration) {
  const animation = getAnimationById(state, animationId);

  if (
    !animation ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return false;
  }

  animation.duration = duration;

  if (state.animationManager.selectedAnimationId === animationId) {
    state.animationManager.duration = duration;
    state.animationManager.currentTime = Math.min(
      state.animationManager.currentTime,
      duration
    );
  }

  return true;
}

export function setAnimationLoop(state, animationId, loop) {
  const animation = getAnimationById(state, animationId);

  if (!animation) {
    return false;
  }

  animation.loop = Boolean(loop);

  return true;
}
