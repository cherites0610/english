import React from 'react';
import { Tabs } from 'expo-router';
import BottomNavBar, { TabConfig } from '@/src/components/BottomNavBar';

const tabsConfig: TabConfig[] = [
  { name: '(tabs)/tasks', label: '任務', iconName: 'checkbox-outline' },
  { name: '(tabs)/index', label: '首頁', iconName: 'home-outline' },
  { name: '(tabs)/profile', label: '我的', iconName: 'person-circle-outline' },
];

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => {
        const activeTabName = props.state.routeNames[props.state.index];
        const activeRoute = props.state.routes.find(route => route.name === activeTabName);

        const params = activeRoute?.params as { tabBarVisible?: boolean };

        if (params?.tabBarVisible === false) {
          return null;
        }

        const handleTabPress = (tabName: string) => {
          props.navigation.navigate(tabName);
        };

        return (
          <BottomNavBar
            activeTab={activeTabName}
            tabs={tabsConfig}
            onTabPress={handleTabPress}
          />
        );
      }}
    >
      <Tabs.Screen name="(tabs)/tasks" />
      <Tabs.Screen name="(tabs)/index" />
      <Tabs.Screen
        name="(tabs)/profile"
        initialParams={{ tabBarVisible: false }}
      />
    </Tabs>
  );
}