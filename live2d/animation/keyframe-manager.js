
import { getTrackById } from "./animation-track.js";

export function addKeyframe(
  state,
  animationId,
  trackId,
  time,
  value
) {
  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  if (
    !track ||
    !Number.isFinite(time) ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  const animation = state.animations.find(
    item => item.id === animationId
  );

  const clampedTime = Math.max(
    0,
    Math.min(animation.duration, time)
  );

  const parameter = state.parameters.find(
    item => item.id === track.parameterId
  );

  if (!parameter) return null;

  const clampedValue = Math.max(
    parameter.min,
    Math.min(parameter.max, value)
  );

  const existing = track.keyframes.find(
    frame => Math.abs(frame.time - clampedTime) < 0.0001
  );

  if (existing) {
    existing.value = clampedValue;
    return existing;
  }

  const keyframe = {
    id: `keyframe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    time: clampedTime,
    value: clampedValue,
    interpolation: "linear"
  };

  track.keyframes.push(keyframe);

  track.keyframes.sort(
    (a, b) => a.time - b.time
  );

  return keyframe;
}

export function getKeyframeById(
  state,
  animationId,
  trackId,
  keyframeId
) {
  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  if (!track) return null;

  return track.keyframes.find(
    frame => frame.id === keyframeId
  ) || null;
}

export function getAllKeyframes(
  state,
  animationId,
  trackId
) {
  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  return track ? [...track.keyframes] : [];
}

export function removeKeyframe(
  state,
  animationId,
  trackId,
  keyframeId
) {
  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  if (!track) return false;

  const index = track.keyframes.findIndex(
    frame => frame.id === keyframeId
  );

  if (index === -1) return false;

  track.keyframes.splice(index, 1);

  return true;
}

export function updateKeyframe(
  state,
  animationId,
  trackId,
  keyframeId,
  updates
) {
  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  if (!track || !updates) return false;

  const keyframe = track.keyframes.find(
    frame => frame.id === keyframeId
  );

  if (!keyframe) return false;

  if (
    updates.time !== undefined &&
    Number.isFinite(updates.time)
  ) {
    const animation = state.animations.find(
      item => item.id === animationId
    );

    keyframe.time = Math.max(
      0,
      Math.min(animation.duration, updates.time)
    );
  }

  if (
    updates.value !== undefined &&
    Number.isFinite(updates.value)
  ) {
    const parameter = state.parameters.find(
      item => item.id === track.parameterId
    );

    if (!parameter) return false;

    keyframe.value = Math.max(
      parameter.min,
      Math.min(parameter.max, updates.value)
    );
  }

  if (
    ["linear", "hold", "bezier"].includes(
      updates.interpolation
    )
  ) {
    keyframe.interpolation = updates.interpolation;
  }

  track.keyframes.sort(
    (a, b) => a.time - b.time
  );

  return true;
}

export function findKeyframeAtTime(
  state,
  animationId,
  trackId,
  time,
  tolerance = 0.05
) {
  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  if (!track) return null;

  return track.keyframes.find(
    frame => Math.abs(frame.time - time) <= tolerance
  ) || null;
}
