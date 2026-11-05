import { AttributeInputLocation } from '../src';
import { describe, expect, it, vi } from 'vitest';
import { parse } from '@journeyapps/common-xml';
import { XMLNodeInput } from '../../document-xml/src/XMLNodeInput';
import { ContentTextAttribute, Node, NumberAttribute } from '../src';

describe('Explicit XML attribute inputs', () => {
  it.each([
    { xml: '<label title="">Fallback</label>', location: AttributeInputLocation.ATTRIBUTE, value: '' },
    { xml: '<label>Hello {name}</label>', location: AttributeInputLocation.CONTENT, value: 'Hello {name}' }
  ])('routes $location input and format validation through the shared parser', ({ xml, location, value }) => {
    const definition = new Node({ name: 'label' });
    const attribute = new ContentTextAttribute({ name: 'title' });
    definition.addAttribute(attribute);
    const parseInput = vi.spyOn(attribute, 'parseInput');
    const validateFormatAttribute = vi.fn();
    const validateFormatContent = vi.fn();
    const element = parse(xml).documentElement;
    const scope = { getReference: () => null };
    const node = definition.parseTree({
      input: new XMLNodeInput(element, xml),
      report: vi.fn(),
      validateExpression: ({ expression, location }) => {
        if (location === AttributeInputLocation.CONTENT) {
          validateFormatContent({ element, scope, expression });
          return;
        }
        validateFormatAttribute({ element, scope, attribute: attribute.name, expression });
      },
      scope
    });
    expect(parseInput).toHaveBeenCalledOnce();
    expect(node.attribute('title').expression().raw()).toBe(value);
    if (location === AttributeInputLocation.CONTENT) {
      expect(validateFormatContent).toHaveBeenCalledWith({ element, scope, expression: node.content() });
      expect(validateFormatAttribute).not.toHaveBeenCalled();
      expect(node.attribute('title').stringify()).toEqual({ isAttribute: false, value });
      return;
    }
    expect(validateFormatAttribute).toHaveBeenCalledWith({
      element,
      scope,
      attribute: 'title',
      expression: node.attribute('title').expression()
    });
    expect(validateFormatContent).not.toHaveBeenCalled();
    expect(node.content()).toBeUndefined();
  });

  it('retains the XML attribute location for syntax errors', () => {
    const text = '<item size="invalid" />';
    const input = XMLNodeInput.parse(text).attribute('size');
    const report = vi.fn();
    const attribute = new NumberAttribute({ name: 'size' }).parseInput(input, { report });
    expect(attribute.hasErrors()).toBe(true);
    expect(attribute.errors()[0].source).toBe(input.source);
    expect(report).toHaveBeenCalledWith(attribute.errors()[0]);
  });
});
