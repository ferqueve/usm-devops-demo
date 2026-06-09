import { createDrawerNavigator } from '@react-navigation/drawer';
import { colors } from '../theme';
import { DrawerContent } from './DrawerContent';
import { AppHeader } from './AppHeader';
import DashboardScreen from '../screens/DashboardScreen';
import EspaciosScreen from '../screens/EspaciosScreen';
import ReservasScreen from '../screens/ReservasScreen';
import CalendarioScreen from '../screens/CalendarioScreen';
import InventarioScreen from '../screens/InventarioScreen';
import UsuariosScreen from '../screens/UsuariosScreen';
import AuditoriaScreen from '../screens/AuditoriaScreen';
import EstadisticasScreen from '../screens/EstadisticasScreen';
import SistemaScreen from '../screens/SistemaScreen';
import AsistenteScreen from '../screens/AsistenteScreen';

const Drawer = createDrawerNavigator();

export function AppNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        header: (props) => <AppHeader {...props} />,
        drawerType: 'front',
        swipeEdgeWidth: 40,
        sceneStyle: { backgroundColor: colors.secondary },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Calendario" component={CalendarioScreen} />
      <Drawer.Screen name="Reservas" component={ReservasScreen} />
      <Drawer.Screen name="Espacios" component={EspaciosScreen} />
      <Drawer.Screen name="Inventario" component={InventarioScreen} />
      <Drawer.Screen name="Estadisticas" component={EstadisticasScreen} />
      <Drawer.Screen name="Asistente" component={AsistenteScreen} />
      <Drawer.Screen name="Usuarios" component={UsuariosScreen} />
      <Drawer.Screen name="Sistema" component={SistemaScreen} />
      <Drawer.Screen name="Auditoria" component={AuditoriaScreen} />
    </Drawer.Navigator>
  );
}
