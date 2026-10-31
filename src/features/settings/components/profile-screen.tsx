import { useState } from 'react';

import { FormMessage, PrimaryButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { copy } from '@/constants/copy';
import { useSettings } from '@/providers/settings-provider';

export function ProfileScreen() {
  const settings = useSettings();
  const [name, setName] = useState(settings.profileName);
  const [symbol, setSymbol] = useState(settings.currencySymbol);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await settings.saveProfile(name, symbol);
      setMessage(null);
      setSaving(false);
    } catch {
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TextField label={copy.name} value={name} onChangeText={setName} />
      <TextField label={copy.currency} value={symbol} onChangeText={setSymbol} />
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}
