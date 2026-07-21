import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export type PickedChatImage = {
  /** Local file URI — cheap to render as an immediate preview before sending. */
  uri: string;
  base64: string;
  mimeType: string;
};

// Matches Claude's own internal image downsampling threshold — resizing further only
// costs upload bandwidth, not answer quality.
const MAX_EDGE = 1568;
const JPEG_QUALITY = 0.75;

async function processAsset(asset: ImagePicker.ImagePickerAsset): Promise<PickedChatImage> {
  const longestEdge = Math.max(asset.width, asset.height);
  const scale = longestEdge > MAX_EDGE ? MAX_EDGE / longestEdge : 1;

  const rendered = await ImageManipulator.manipulate(asset.uri)
    .resize({ width: Math.round(asset.width * scale), height: Math.round(asset.height * scale) })
    .renderAsync();
  // Always re-encode as JPEG (not just resize when already small): source photos can be
  // HEIC on iOS, which Claude's vision input doesn't accept.
  const result = await rendered.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error("Image processing did not return base64 data");
  }
  return { uri: result.uri, base64: result.base64, mimeType: "image/jpeg" };
}

/** A camera only ever captures one shot per launch, unlike the library picker below. */
export const CAMERA_SELECTION_LIMIT = 1;

/** Matches the composer's preview row — more than this and the chip row gets unwieldy
 * and the payload size grows past what's reasonable for one chat message. */
export const LIBRARY_SELECTION_LIMIT = 4;

/** Returns [] if the user cancels the picker or denies the permission. */
export async function pickChatImageFromCamera(): Promise<PickedChatImage[]> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 });
  if (result.canceled || !result.assets[0]) return [];
  return [await processAsset(result.assets[0])];
}

/** Returns [] if the user cancels the picker or denies the permission. Lets the user pick
 * up to LIBRARY_SELECTION_LIMIT photos in one go. */
export async function pickChatImagesFromLibrary(): Promise<PickedChatImage[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
    allowsMultipleSelection: true,
    selectionLimit: LIBRARY_SELECTION_LIMIT,
  });
  if (result.canceled || result.assets.length === 0) return [];
  return Promise.all(result.assets.map(processAsset));
}
