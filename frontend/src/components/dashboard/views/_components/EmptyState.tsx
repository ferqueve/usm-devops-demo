interface EmptyStateProps {
  title: string;
}

/** Línea sutil cuando no hay datos. Sin íconos ni descripciones largas. */
export function EmptyState({ title }: Readonly<EmptyStateProps>) {
  return (
    <p className="text-xs text-muted-foreground py-6 text-center">{title}</p>
  );
}
