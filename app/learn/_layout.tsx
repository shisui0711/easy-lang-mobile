import { Stack } from 'expo-router';

export default function LearnLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#F8FAFC',
        },
        headerTintColor: '#1E293B',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="vocabulary"
        options={{
          title: 'Vocabulary Practice',
          headerBackTitle: 'Learn',
        }}
      />
      <Stack.Screen
        name="writing"
        options={{
          title: 'Writing Practice',
          headerBackTitle: 'Learn',
        }}
      />
      <Stack.Screen
        name="reading"
        options={{
          title: 'Reading Practice',
          headerBackTitle: 'Learn',
        }}
      />
      <Stack.Screen
        name="listening"
        options={{
          title: 'Listening Practice',
          headerBackTitle: 'Learn',
        }}
      />
      <Stack.Screen
        name="speaking"
        options={{
          title: 'Speaking Practice',
          headerBackTitle: 'Learn',
        }}
      />
      <Stack.Screen
        name="grammar"
        options={{
          title: 'Grammar Practice',
          headerBackTitle: 'Learn',
        }}
      />
    </Stack>
  );
}