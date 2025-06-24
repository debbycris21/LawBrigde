import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TelaInicial from './Telas/TelaInicial';
import TelaAdvogado from './Telas/TelaAdvogado';
import TelaCliente from './Telas/TelaCliente';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="TelaInicial"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#9370db', // Cor roxa do seu tema
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="TelaInicial" 
          component={TelaInicial}
          options={{ title: 'LawBridge', headerShown: false }} // Esconde o header na tela inicial
        />
        <Stack.Screen 
          name="TelaAdvogado" 
          component={TelaAdvogado}
          options={{ title: 'Área do Advogado' }}
        />
        <Stack.Screen 
          name="TelaCliente" 
          component={TelaCliente}
          options={{ title: 'Área do Cliente' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;