import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

/**
 * Detect a single face in a video/image element and return the 128-float descriptor.
 * Returns null if no face found.
 */
export async function getFaceDescriptor(videoEl) {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection ? Array.from(detection.descriptor) : null;
}

/**
 * Compare two 128-float descriptors.
 * Returns a distance value — lower means more similar.
 * Typical threshold: 0.6 (below = same person).
 */
export function compareFaces(descriptor1, descriptor2) {
  const a = new Float32Array(descriptor1);
  const b = new Float32Array(descriptor2);
  return faceapi.euclideanDistance(a, b);
}

export const FACE_MATCH_THRESHOLD = 0.55;
