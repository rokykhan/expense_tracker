import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const FILE_NAME = 'hisabkhata-report.csv';

function downloadCsv(csv: string, filename: string): void {
  const document = globalThis.document;
  if (!document) {
    throw new Error('Download is unavailable.');
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportCsvFile(csv: string): Promise<void> {
  if (Platform.OS === 'web') {
    downloadCsv(csv, FILE_NAME);
    return;
  }

  const file = new File(Paths.cache, FILE_NAME);
  await file.write(csv);
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is unavailable.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'হিসাবখাতা',
    UTI: 'public.comma-separated-values-text',
  });
}
