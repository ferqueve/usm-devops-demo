import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

describe('Accordion', () => {
  it('expande contenido al hacer click en trigger', async () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="x">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Contenido</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    const trigger = screen.getByRole('button', { name: /Trigger/ });
    expect(trigger).toHaveAttribute('data-state', 'closed');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('data-state', 'open');
  });

  it('aplica data-slot', () => {
    const { container } = render(
      <Accordion type="single">
        <AccordionItem value="a">
          <AccordionTrigger>x</AccordionTrigger>
          <AccordionContent>y</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    expect(container.querySelector('[data-slot="accordion-item"]')).not.toBeNull();
  });
});
