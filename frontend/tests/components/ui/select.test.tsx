import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

describe('Select', () => {
  it('renderiza el trigger con valor por defecto', () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger>
          <SelectValue placeholder="Elige" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('aplica data-slot=select-trigger', () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="x" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="x">X</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(container.querySelector('[data-slot="select-trigger"]')).not.toBeNull();
  });
});
