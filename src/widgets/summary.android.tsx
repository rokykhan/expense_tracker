import { Button, Column, Text, type ButtonProps } from '@expo/ui/jetpack-compose';
import { background, fillMaxSize, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

import { ADD_ENTRY_TARGET, type SummaryProps } from '@/features/widget/domain/summary';

const INITIAL: SummaryProps = {
  todayLabel: 'আজকের ব্যয়',
  todayValue: '৳০.০০',
  monthLabel: 'সঞ্চয়',
  monthValue: '৳০.০০',
  addLabel: 'নতুন এন্ট্রি',
};

function SummaryWidget(props: SummaryProps) {
  'widget';
  const addButton = {
    target: ADD_ENTRY_TARGET,
    label: props.addLabel,
    colors: { containerColor: '#1F4D6E', contentColor: '#FFFFFF' },
    onClick: () => {},
    children: <Text color="#FFFFFF">{props.addLabel}</Text>,
  };

  return (
    <Column modifiers={[fillMaxSize(), paddingAll(12), background('#F4F7FA')]}>
      <Text color="#5E6570" style={{ fontSize: 13 }}>
        {props.todayLabel}
      </Text>
      <Text color="#10202B" style={{ fontSize: 22, fontWeight: 'bold' }}>
        {props.todayValue}
      </Text>
      <Text color="#5E6570" style={{ fontSize: 13 }}>
        {props.monthLabel}
      </Text>
      <Text color="#10202B" style={{ fontSize: 22, fontWeight: 'bold' }}>
        {props.monthValue}
      </Text>
      <Button {...(addButton as ButtonProps)} />
    </Column>
  );
}

export default createWidget('Summary', SummaryWidget, INITIAL);
