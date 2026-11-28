
import { getSelectedAnimation } from "./animation-manager.js";
import { calculateTrackValue } from "./animation-interpolation.js";
import { setParameterValue } from "../parameters/parameter-manager.js";

export function initializePlayback(state) {
  state.playbackController = {
    playing: false,
    currentTime: 0,
    lastTimestamp: null,
    animationFrameId: null,
    speed: 1
  };

  console.log("Animation Playback: Ready");
}

export function playAnimation(state) {
  const controller = state.playbackController;
  const animation = getSelectedAnimation(state);

  if (!controller || !animation) return false;

  if (controller.playing) return true;

  controller.playing = true;
  controller.lastTimestamp = null;

  state.playback = true;
  state.animationManager.playing = true;

  controller.animationFrameId = requestAnimationFrame(
    timestamp => playbackLoop(state, timestamp)
  );

  return true;
}

function playbackLoop(state, timestamp) {
  const controller = state.playbackController;
  const animation = getSelectedAnimation(state);

  if (!controller || !controller.playing || !animation) {
    stopAnimation(state);
    return;
  }

  if (controller.lastTimestamp === null) {
    controller.lastTimestamp = timestamp;
  }

  const deltaTime =
    (timestamp - controller.lastTimestamp) / 1000;

  controller.lastTimestamp = timestamp;

  controller.currentTime += deltaTime * controller.speed;

  if (controller.currentTime >= animation.duration) {
    if (animation.loop) {
      controller.currentTime %= animation.duration;
    } else {
      controller.currentTime = animation.duration;
      applyAnimationAtTime(state, animation, controller.currentTime);
      stopAnimation(state);
      return;
    }
  }

  applyAnimationAtTime(
    state,
    animation,
    controller.currentTime
  );

  state.animationManager.currentTime = controller.currentTime;
  state.currentFrame = Math.round(
    controller.currentTime * animation.frameRate
  );

  state.requestRender?.();

  controller.animationFrameId = requestAnimationFrame(
    nextTimestamp => playbackLoop(state, nextTimestamp)
  );
}

export function pauseAnimation(state) {
  const controller = state.playbackController;

  if (!controller) return;

  controller.playing = false;

  if (controller.animationFrameId !== null) {
    cancelAnimationFrame(controller.animationFrameId);
    controller.animationFrameId = null;
  }

  state.playback = false;
  state.animationManager.playing = false;
}

export function stopAnimation(state) {
  pauseAnimation(state);

  const controller = state.playbackController;

  if (!controller) return;

  controller.currentTime = 0;
  controller.lastTimestamp = null;

  state.animationManager.currentTime = 0;
  state.currentFrame = 0;

  const animation = getSelectedAnimation(state);

  if (animation) {
    applyAnimationAtTime(state, animation, 0);
  }

  state.requestRender?.();
}

export function seekAnimation(state, time) {
  const controller = state.playbackController;
  const animation = getSelectedAnimation(state);

  if (!controller || !animation || !Number.isFinite(time)) {
    return false;
  }

  controller.currentTime = Math.max(
    0,
    Math.min(animation.duration, time)
  );

  state.animationManager.currentTime = controller.currentTime;
  state.currentFrame = Math.round(
    controller.currentTime * animation.frameRate
  );

  applyAnimationAtTime(
    state,
    animation,
    controller.currentTime
  );

  state.requestRender?.();

  return true;
}

export function setPlaybackSpeed(state, speed) {
  if (
    !state.playbackController ||
    !Number.isFinite(speed) ||
    speed <= 0
  ) {
    return false;
  }

  state.playbackController.speed = Math.max(
    0.1,
    Math.min(4, speed)
  );

  return true;
}

export function applyAnimationAtTime(state, animation, time) {
  if (!animation) return;

  for (const track of animation.tracks) {
    if (!track.enabled) continue;

    const parameter = state.parameters.find(
      item => item.id === track.parameterId
    );

    if (!parameter) continue;

    const value = calculateTrackValue(
      track,
      time,
      parameter.defaultValue
    );

    setParameterValue(
      state,
      parameter.id,
      value
    );
  }
}
