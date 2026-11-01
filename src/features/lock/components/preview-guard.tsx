import { useEffect } from 'react';

import { applyPreviewHidden } from '@/features/lock/data/preview';
import { useSettings } from '@/providers/settings-context';

export function PreviewGuard() {
  const { hidePreview } = useSettings();

  useEffect(() => {
    void applyPreviewHidden(hidePreview);
  }, [hidePreview]);

  return null;
}
