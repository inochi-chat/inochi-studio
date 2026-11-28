
export function createTrack(state, animationId, parameterId) {
  const animation = state.animations.find(
    item => item.id === animationId
  );

  if (!animation || !parameterId) {
    return null;
  }

  const existing = animation.tracks.find(
    track => track.parameterId === parameterId
  );

  if (existing) {
    return existing;
  }

  const track = {
    id: `track_${Date.now()}_${animation.tracks.length}`,
    parameterId,
    name: parameterId,
    keyframes: [],
    enabled: true,
    createdAt: Date.now()
  };

  animation.tracks.push(track);

  return track;
}

export function getTrackById(state, animationId, trackId) {
  const animation = state.animations.find(
    item => item.id === animationId
  );

  if (!animation) return null;

  return animation.tracks.find(
    track => track.id === trackId
  ) || null;
}

export function getTrackByParameterId(
  state,
  animationId,
  parameterId
) {
  const animation = state.animations.find(
    item => item.id === animationId
  );

  if (!animation) return null;

  return animation.tracks.find(
    track => track.parameterId === parameterId
  ) || null;
}

export function getAllTracks(state, animationId) {
  const animation = state.animations.find(
    item => item.id === animationId
  );

  return animation ? [...animation.tracks] : [];
}

export function removeTrack(state, animationId, trackId) {
  const animation = state.animations.find(
    item => item.id === animationId
  );

  if (!animation) return false;

  const index = animation.tracks.findIndex(
    track => track.id === trackId
  );

  if (index === -1) return false;

  animation.tracks.splice(index, 1);

  return true;
}

export function renameTrack(
  state,
  animationId,
  trackId,
  newName
) {
  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  if (!track || typeof newName !== "string") {
    return false;
  }

  const name = newName.trim();

  if (!name) return false;

  track.name = name;

  return true;
}

export function setTrackEnabled(
  state,
  animationId,
  trackId,
  enabled
) {
  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  if (!track) return false;

  track.enabled = Boolean(enabled);

  return true;
}

export function clearTrackKeyframes(
  state,
  animationId,
  trackId
) {
  const track = getTrackById(
    state,
    animationId,
    trackId
  );

  if (!track) return false;

  track.keyframes = [];

  return true;
}
