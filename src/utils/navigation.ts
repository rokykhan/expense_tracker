import { type Href, router } from 'expo-router';

export function openPath(path: string) {
  router.push(path as Href);
}

export function leaveScreen() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}
