import { describe, expect, it } from 'vitest';
import { NumberAttribute, ParsedValue, ConstantExpressionValueProvider } from '@ja-platform/parser-core';
import { XMLNodeInput, XMLSourceReference } from '../src';

describe('XML document input', () => {
  it('extracts attributes and children for the shared attribute parser', () => {
    const text = '<view\n size="12"><button label="Save" /></view>';
    const input = XMLNodeInput.parse(text);
    expect(input.name).toBe('view');
    expect(input.attribute('missing')).toBeUndefined();
    expect([...input.children()].map((child) => child.name)).toEqual(['button']);
    const size = input.attribute('size');
    expect(size.source).toBeInstanceOf(XMLSourceReference);
    expect(size.source.range.start).toBeGreaterThan(0);
    expect(size.source.range.end).toBeLessThanOrEqual(text.length);
    const attribute = new NumberAttribute({ name: 'size' }).parseInput(size);
    const provider = new ConstantExpressionValueProvider();
    const value = new ParsedValue(attribute, [provider]);
    expect(value.current).toBe(12);
    value.dispose();
    provider.dispose();
  });
});
