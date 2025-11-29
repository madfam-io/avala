import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

describe('Accordion', () => {
  it('renders accordion items', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Question 1</AccordionTrigger>
          <AccordionContent>Answer 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(screen.getByText('Question 1')).toBeInTheDocument();
  });

  it('expands accordion on trigger click', async () => {
    const user = userEvent.setup();

    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Click me</AccordionTrigger>
          <AccordionContent>Hidden content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    await user.click(screen.getByText('Click me'));
    expect(screen.getByText('Hidden content')).toBeVisible();
  });

  it('renders multiple accordion items', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Item 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders chevron icon', () => {
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>With Icon</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
