import { Button, Text, VStack } from '@expo/ui/swift-ui';
import { background, font, foregroundStyle, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import { ADD_ENTRY_TARGET, ADD_ENTRY_URL, type SummaryProps } from '@/features/widget/domain/summary';

const INITIAL: SummaryProps = {
  todayLabel: 'আজকের ব্যয়',
  todayValue: '৳০.০০',
  monthLabel: 'সঞ্চয়',
  monthValue: '৳০.০০',
  addLabel: 'নতুন এন্ট্রি',
};

function SummaryWidget(props: SummaryProps) {
  'widget';
  return (
    <VStack modifiers={[padding({ all: 12 }), background('#F4F7FA')]}>
      <Text modifiers={[font({ size: 13 }), foregroundStyle('#5E6570')]}>{props.todayLabel}</Text>
      <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle('#10202B')]}>{props.todayValue}</Text>
      <Text modifiers={[font({ size: 13 }), foregroundStyle('#5E6570')]}>{props.monthLabel}</Text>
      <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle('#10202B')]}>{props.monthValue}</Text>
      <Button
        label={props.addLabel}
        target={ADD_ENTRY_TARGET}
        modifiers={[widgetURL(ADD_ENTRY_URL)]}
        onPress={() => props}
      />
    </VStack>
  );
}

export default createWidget('Summary', SummaryWidget, INITIAL);
