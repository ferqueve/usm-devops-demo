import { fonts } from '../../theme';
import { Text, type TextProps } from './Text';

/**
 * Render markdown-lite: soporta **negrita** y respeta saltos de línea.
 * Suficiente para las respuestas del asistente (que usan **bold**).
 */
export function MarkdownText({ children, ...props }: TextProps & { children: string }) {
  const segments = children.split('**');
  return (
    <Text {...props}>
      {segments.map((seg, i) =>
        i % 2 === 1 ? (
          <Text key={i} {...props} style={{ fontFamily: fonts.semibold }}>
            {seg}
          </Text>
        ) : (
          seg
        ),
      )}
    </Text>
  );
}
