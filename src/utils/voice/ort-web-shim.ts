/**
 * Ensures onnxruntime-common is loaded before ort-web.min.js runs.
 * The browser bundle (UMD) calls require("onnxruntime-common"); if that runs
 * before common is in the module graph, registerBackend is undefined.
 */
import 'onnxruntime-common';

// Re-export the browser bundle (alias 'onnxruntime-web-browser' -> dist/ort-web.min.js)
export * from 'onnxruntime-web-browser';
import * as ort from 'onnxruntime-web-browser';
const def = (ort as { default?: unknown }).default ?? ort;
export default def;
