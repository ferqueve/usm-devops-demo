import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs', () => {
  it('muestra el panel del tab activo', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
        <TabsContent value="b">Panel B</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Panel A')).toBeInTheDocument();
    expect(screen.queryByText('Panel B')).not.toBeInTheDocument();
  });

  it('cambia de panel al hacer click en otro trigger', async () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
        <TabsContent value="b">Panel B</TabsContent>
      </Tabs>
    );
    await userEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(screen.getByText('Panel B')).toBeInTheDocument();
  });

  it('aplica data-slot en partes', () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">x</TabsContent>
      </Tabs>
    );
    expect(container.querySelector('[data-slot="tabs"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="tabs-list"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="tabs-trigger"]')).not.toBeNull();
  });
});
