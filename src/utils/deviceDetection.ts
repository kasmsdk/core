export interface DeviceCapabilities {
  hasWebXR: boolean;
  hasWebGPU: boolean;
  hasWebCodecs: boolean;
  hasWebMIDI: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  supportsARCore: boolean;
  supportsARKit: boolean;
}

export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobile/.test(userAgent);

  // Check WebXR support
  const hasWebXR = Boolean('xr' in navigator && navigator.xr && 'isSessionSupported' in navigator.xr);

  // Check WebGPU support
  const hasWebGPU = 'gpu' in navigator;

  // Check WebCodecs support
  const hasWebCodecs = 'VideoEncoder' in window && 'VideoDecoder' in window;

  // Check TechWebMIDI support
  let hasWebMIDI = false;
  try {
    hasWebMIDI = 'requestMIDIAccess' in navigator;
  } catch {
    hasWebMIDI = false;
  }

  // Check AR platform support
  const supportsARCore = Boolean(isAndroid && hasWebXR);
  const supportsARKit = Boolean(isIOS); // iOS uses .usdz files for AR

  return {
    hasWebXR,
    hasWebGPU,
    hasWebCodecs,
    hasWebMIDI,
    isIOS,
    isAndroid,
    isMobile,
    supportsARCore,
    supportsARKit,
  };
}

export async function checkWebXRSupport(): Promise<{
  immersiveAR: boolean;
  immersiveVR: boolean;
  inline: boolean;
}> {
  if (!('xr' in navigator) || !navigator.xr) {
    return { immersiveAR: false, immersiveVR: false, inline: false };
  }

  try {
    const [immersiveAR, immersiveVR, inline] = await Promise.all([
      navigator.xr.isSessionSupported('immersive-ar'),
      navigator.xr.isSessionSupported('immersive-vr'),
      navigator.xr.isSessionSupported('inline'),
    ]);

    return { immersiveAR, immersiveVR, inline };
  } catch (error) {
    console.warn('WebXR support check failed:', error);
    return { immersiveAR: false, immersiveVR: false, inline: false };
  }
}

export function getRecommendedExperience(capabilities: DeviceCapabilities): 'ar' | '3d' | 'fallback' {
  if (capabilities.supportsARCore || capabilities.supportsARKit) {
    return 'ar';
  }

  if (capabilities.hasWebGPU || !capabilities.isMobile) {
    return '3d';
  }

  return 'fallback';
}

export function generateIOSARLink(modelUrl: string, title: string = 'AR Model'): string {
  // Generate .usdz AR Quick Look link for iOS
  const baseUrl = window.location.origin;
  const fullModelUrl = modelUrl.startsWith('http') ? modelUrl : `${baseUrl}${modelUrl}`;

  return `${fullModelUrl}#allowsContentScaling=0&canonicalWebPageURL=${encodeURIComponent(window.location.href)}&checkoutTitle=${encodeURIComponent(title)}`;
}
