import { EmptyScreen } from '@/components/empty-screen';
import { copy } from '@/constants/copy';

export default function ReportsScreen() {
  return <EmptyScreen title={copy.tabs.reports} message={copy.reportsEmpty} />;
}
