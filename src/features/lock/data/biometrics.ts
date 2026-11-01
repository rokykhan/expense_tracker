import { authenticateAsync, hasHardwareAsync, isEnrolledAsync } from 'expo-local-authentication';

export async function biometricsAvailable(): Promise<boolean> {
  try {
    return (await hasHardwareAsync()) && (await isEnrolledAsync());
  } catch {
    return false;
  }
}

export async function confirmBiometric(): Promise<boolean> {
  try {
    if (!(await biometricsAvailable())) {
      return false;
    }
    const result = await authenticateAsync({
      promptMessage: 'হিসাবখাতা খুলুন',
      cancelLabel: 'বাতিল',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
