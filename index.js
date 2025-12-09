import { registerRootComponent } from 'expo';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="light" />
    </>
  );
}

registerRootComponent(App);

