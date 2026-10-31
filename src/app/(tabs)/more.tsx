import { EmptyScreen } from '@/components/empty-screen';
import { copy } from '@/constants/copy';

export default function MoreScreen() {
  return <EmptyScreen title={copy.tabs.more} message={copy.moreEmpty} />;
}