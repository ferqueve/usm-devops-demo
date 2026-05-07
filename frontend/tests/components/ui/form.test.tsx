import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';

function Wrapper() {
  const form = useForm({ defaultValues: { name: '' } });
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl>
              <input {...field} />
            </FormControl>
            <FormDescription>desc</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

describe('Form', () => {
  it('renderiza label y descripcion', () => {
    render(<Wrapper />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('desc')).toBeInTheDocument();
  });

  it('asocia label e input via id', () => {
    render(<Wrapper />);
    const input = screen.getByLabelText('Nombre');
    expect(input.tagName).toBe('INPUT');
  });
});
