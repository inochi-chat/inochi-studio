
import {
  getTrackById
} from "./animation-track.js";

import {
  updateKeyframe,
  addKeyframe,
  removeKeyframe
} from "./keyframe-manager.js";

export function initializeKeyframeEditor(state) {
  state.keyframeEditor = {
    selectedKeyframes: [],
    dragging: false,
    dragStartTime: 0,
    dragOriginalTimes: [],
    copiedKeyframes: [],
    clipboard: null,
    snapEnabled: true
  };

  console.log("Keyframe Editor: Ready");
}

export function selectKeyframe(
  state,
  animationId,
  trackId,
  keyframeId,
  additive = false
) {
  const editor = state.keyframeEditor;

  if (!editor) return false;

  const selection = {
    animationId,
    trackId,
    keyframeId
  };

  if (!additive) {
    editor.selectedKeyframes = [selection];
  } else {
    const index = editor.selectedKeyframes.findIndex(
      item =>
        item.animationId === animationId &&
        item.trackId === trackId &&
        item.keyframeId === keyframeId
    );

    if (index >= 0) {
      editor.selectedKeyframes.splice(index, 1);
    } else {
      editor.selectedKeyframes.push(selection);
    }
  }

  return true;
}

export function clearKeyframeSelection(state) {
  if (!state.keyframeEditor) return;

  state.keyframeEditor.selectedKeyframes = [];
}

export function moveKeyframe(
  state,
  animationId,
  trackId,
  keyframeId,
  newTime
) {
  if (!Number.isFinite(newTime)) return false;

  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  if (!track) return false;

  const frame = track.keyframes.find(
    item => item.id === keyframeId
  );

  if (!frame) return false;

  const animation = state.animations.find(
    item => item.id === animationId
  );

  if (!animation) return false;

  const targetTime = Math.max(
    0,
    Math.min(animation.duration, newTime)
  );

  const collision = track.keyframes.find(
    item =>
      item.id !== keyframeId &&
      Math.abs(item.time - targetTime) < 0.0001
  );

  if (collision) return false;

  return updateKeyframe(
    state,
    animationId,
    trackId,
    keyframeId,
    { time: targetTime }
  );
}

export function duplicateKeyframe(
  state,
  animationId,
  trackId,
  keyframeId,
  offset = 1 / 30
) {
  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  if (!track) return null;

  const frame = track.keyframes.find(
    item => item.id === keyframeId
  );

  if (!frame) return null;

  const animation = state.animations.find(
    item => item.id === animationId
  );

  if (!animation) return null;

  const newTime = Math.min(
    animation.duration,
    frame.time + Math.max(0, offset)
  );

  return addKeyframe(
    state,
    animationId,
    trackId,
    newTime,
    frame.value
  );
}

export function copySelectedKeyframes(state) {
  const editor = state.keyframeEditor;

  if (!editor) return false;

  const copied = [];

  for (const selection of editor.selectedKeyframes) {
    const track = getTrackById(
      state,
      selection.animationId,
      selection.trackId
    );

    const frame = track?.keyframes.find(
      item => item.id === selection.keyframeId
    );

    if (!frame) continue;

    copied.push({
      trackId: selection.trackId,
      time: frame.time,
      value: frame.value,
      interpolation: frame.interpolation
    });
  }

  if (copied.length === 0) return false;

  editor.clipboard = copied;

  return true;
}

export function pasteKeyframes(
  state,
  animationId,
  targetTime
) {
  const editor = state.keyframeEditor;

  if (!editor?.clipboard?.length) return [];

  const animation = state.animations.find(
    item => item.id === animationId
  );

  if (!animation) return [];

  const firstTime = Math.min(
    ...editor.clipboard.map(frame => frame.time)
  );

  const pasted = [];

  for (const frame of editor.clipboard) {
    const newTime = Math.max(
      0,
      Math.min(
        animation.duration,
        targetTime + frame.time - firstTime
      )
    );

    const newFrame = addKeyframe(
      state,
      animationId,
      frame.trackId,
      newTime,
      frame.value
    );

    if (newFrame) {
      newFrame.interpolation = frame.interpolation;
      pasted.push(newFrame);
    }
  }

  return pasted;
}

export function deleteSelectedKeyframes(state) {
  const editor = state.keyframeEditor;

  if (!editor) return 0;

  let deleted = 0;

  for (const selection of [...editor.selectedKeyframes]) {
    const success = removeKeyframe(
      state,
      selection.animationId,
      selection.trackId,
      selection.keyframeId
    );

    if (success) deleted++;
  }

  clearKeyframeSelection(state);

  return deleted;
}

export function getSelectedKeyframes(state) {
  return state.keyframeEditor
    ? [...state.keyframeEditor.selectedKeyframes]
    : [];
}
