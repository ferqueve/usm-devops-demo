import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, utec, themed } from '../../theme';
import { getIniciales } from '../../lib/format';
import { Text } from './Text';

/** Pares de gradiente derivados de la paleta UTEC (como el avatar del web). */
const GRADIENTS: [string, string][] = [
  [utec.blue, utec.cyan],
  [utec.green, utec.yellow],
  [utec.orange, utec.red],
  [utec.purple, utec.blue],
  [utec.cyan, utec.green],
];

function hashIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % mod;
}

export type AvatarInitialsProps = {
  name: string;
  /** Semilla estable para el color (ej. email). */
  seed?: string;
  size?: number;
};

export function AvatarInitials({ name, seed, size = 40 }: AvatarInitialsProps) {
  const [from, to] = GRADIENTS[hashIndex(seed ?? name, GRADIENTS.length)];
  return (
    <LinearGradient
      colors={[from, to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text
        style={[styles.initials, { fontSize: size * 0.4 }]}
        accessibilityLabel={`Avatar de ${name}`}
      >
        {getIniciales(name)}
      </Text>
    </LinearGradient>
  );
}

const styles = themed((colors) => StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: fonts.bold, color: '#FFFFFF' },
}));
