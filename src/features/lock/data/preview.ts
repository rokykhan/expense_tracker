import { allowScreenCaptureAsync, isAvailableAsync, preventScreenCaptureAsync } from 'expo-screen-capture';

const PREVIEW_KEY = 'hisabkhata-preview';

export async function applyPreviewHidden(hidden: boolean): Promise<void> {
  if (!(await isAvailableAsync())) {
    return;
  }
  if (hidden) {
    await preventScreenCaptureAsync(PREVIEW_KEY);
    return;
  }
  await allowScreenCaptureAsync(PREVIEW_KEY);
}
