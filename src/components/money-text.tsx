import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { useSettings } from '@/providers/settings-provider';
import { formatMoney } from '@/utils/money';

type MoneyTextProps = Omit<ThemedTextProps, 'children'> & {
  paisa: number;
};

export function MoneyText({ paisa, ...rest }: MoneyTextProps) {
  const { banglaDigits, currencySymbol } = useSettings();
  return <ThemedText {...rest}>{formatMoney(paisa, currencySymbol, banglaDigits)}</ThemedText>;
}
