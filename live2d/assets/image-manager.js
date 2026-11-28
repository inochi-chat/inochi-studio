
export function initializeImageManager(state) {
  if (!state.images) {
    state.images = [];
  }

  state.imageManager = {
    nextId: 1,
    selectedImageId: null
  };

  console.log("Image Manager: Ready");
}

export function registerImage(state, imageData) {
  if (!imageData || !imageData.image) {
    throw new Error("登録する画像がありません");
  }

  const image = {
    id: `image_${state.imageManager.nextId++}`,
    name: imageData.name || "Untitled Image",
    image: imageData.image,
    type: imageData.type || "unknown",
    width: imageData.width || imageData.image.naturalWidth,
    height: imageData.height || imageData.image.naturalHeight,
    size: imageData.size || 0,
    visible: true,
    locked: false,
    createdAt: Date.now()
  };

  state.images.push(image);

  if (!state.imageManager.selectedImageId) {
    state.imageManager.selectedImageId = image.id;
  }

  return image;
}

export function getImageById(state, imageId) {
  return state.images.find(
    image => image.id === imageId
  ) || null;
}

export function getAllImages(state) {
  return [...state.images];
}

export function removeImage(state, imageId) {
  const index = state.images.findIndex(
    image => image.id === imageId
  );

  if (index === -1) {
    return false;
  }

  state.images.splice(index, 1);

  if (state.imageManager.selectedImageId === imageId) {
    state.imageManager.selectedImageId =
      state.images[0]?.id || null;
  }

  return true;
}

export function renameImage(state, imageId, newName) {
  const image = getImageById(state, imageId);

  if (!image || typeof newName !== "string") {
    return false;
  }

  const name = newName.trim();

  if (!name) {
    return false;
  }

  image.name = name;

  return true;
}

export function selectImage(state, imageId) {
  const image = getImageById(state, imageId);

  if (!image) {
    return false;
  }

  state.imageManager.selectedImageId = imageId;

  return true;
}

export function setImageVisibility(state, imageId, visible) {
  const image = getImageById(state, imageId);

  if (!image) {
    return false;
  }

  image.visible = Boolean(visible);

  return true;
}

export function setImageLocked(state, imageId, locked) {
  const image = getImageById(state, imageId);

  if (!image) {
    return false;
  }

  image.locked = Boolean(locked);

  return true;
}
