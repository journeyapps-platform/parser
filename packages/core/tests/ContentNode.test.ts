import { XMLSourceReference } from '../../document-xml/src/XMLSourceReference';
import { xmlInput } from './xmlInput';
import {
  EvaluatedExpressionParser,
  FormatStringExpressionParser,
  ConstantExpression,
  FunctionExpression
} from '@ja-platform/parser-expressions';
import { numberType, booleanType, textType } from '@ja-platform/parser-type-system';
import { expect, expectTypeOf, it } from 'vitest';
import { Node, ContentNode, ContentTextAttribute, ConstantExpressionValueProvider } from '../src';

it('parses element content using the declared value type and serializes its original text', () => {
  const definition = new ContentNode({ name: 'timeout', valueType: numberType });
  const { input } = xmlInput('<timeout content="99">30</timeout>');
  const node = definition.parseTree({
    input,
    scope: { getReference: () => null },
    report: () => {}
  });

  expect(node.content().raw()).toBe('30');
  expect(node.attribute('content').stringify()).toEqual({ isAttribute: false, value: '30' });
  expect((node.attribute('content').input?.source as XMLSourceReference).element).toBe(
    (input.source as XMLSourceReference).element
  );
});

it('reports invalid typed content at the content element', () => {
  const definition = new ContentNode({ name: 'timeout', valueType: numberType });
  const { input } = xmlInput('<timeout>invalid</timeout>');
  const node = definition.parseTree({
    input,
    scope: { getReference: () => null },
    report: () => {}
  });
  const attribute = node.attribute('content');

  expect(attribute.expression()).toBeNull();
  expect(attribute.errors()).toHaveLength(1);
  expect((attribute.input?.source as XMLSourceReference).element).toBe((input.source as XMLSourceReference).element);
});

it.each(['Hello {name}', '$:getLabel()', '45', ''])('defaults content nodes to literal text for %j', (text) => {
  const definition = new ContentNode({ name: 'label', valueType: textType });
  const { input } = xmlInput(`<label>${text}</label>`);
  const node = definition.parseTree({
    input,
    scope: { getReference: () => null },
    report: () => {}
  });
  node.setValueProviders([new ConstantExpressionValueProvider()]);
  const value = node.valueTree();
  expectTypeOf(value.current).toEqualTypeOf<string | undefined>();
  expect(node.content().value()).toBe(text);
  expect(value.current).toBe(text);
  expect(node.attribute('content').stringify()).toEqual({ isAttribute: false, value: text });
  value.dispose();
});

it('uses content as the input for prefixed text without rewriting the source', () => {
  const definition = new Node({ name: 'label' });
  definition.addAttribute(new ContentTextAttribute({ name: 'title' }));
  const { input } = xmlInput('<label>$:getLabel()</label>');
  const node = definition.parseTree({
    input,
    scope: { getReference: () => null },
    report: () => {}
  });
  const attribute = node.attribute('title');

  expect(node.content()).toBe(attribute.expression());
  expect(node.content()).toBeInstanceOf(FunctionExpression);
  expect(node.content().raw()).toBe('$:getLabel()');
  expect(attribute.stringify()).toEqual({ isAttribute: false, value: '$:getLabel()' });
  expect((attribute.input?.source as XMLSourceReference).element).toBe((input.source as XMLSourceReference).element);
});

it('parses explicit boolean content', () => {
  const definition = new ContentNode({ name: 'enabled', valueType: booleanType });
  const { input } = xmlInput('<enabled>false</enabled>');
  const node = definition.parseTree({
    input,
    scope: { getReference: () => null },
    report: () => {}
  });
  expectTypeOf(node.content()).toEqualTypeOf<ConstantExpression<boolean> | undefined>();
  expect(node.content().value()).toBe(false);
  expect(node.attribute('content').stringify()).toEqual({ isAttribute: false, value: 'false' });
});

it('accepts explicitly selected evaluated syntax while retaining its source and resolved value type', () => {
  const definition = new ContentNode({
    name: 'timeout',
    valueType: numberType,
    syntax: new EvaluatedExpressionParser()
  });
  const node = definition.parseTree({
    ...xmlInput('<timeout>$:getTimeout()</timeout>'),
    scope: { getReference: () => null },
    report: () => {}
  });
  expect(node.content().code()).toBe('getTimeout()');
  expect(node.attribute('content').stringify()).toEqual({ isAttribute: false, value: '$:getTimeout()' });
  expect(node.attribute('content').definition.normalizeValue('045')).toBe(45);
});

it('validates explicitly selected format syntax as element content', () => {
  const { input } = xmlInput('<label>Hello {name}</label>');
  const scope = { getReference: () => null };
  const validations: Array<[unknown, unknown, unknown]> = [];
  const definition = new ContentNode({
    name: 'label',
    valueType: textType,
    syntax: new FormatStringExpressionParser()
  });
  const node = definition.parseTree({
    input,
    scope,
    report: () => {},
    validateExpression: ({ source, location, expression }) => {
      expect(location).toBe('content');
      validations.push([(source as XMLSourceReference).element, scope, expression]);
    }
  });
  expect(validations).toHaveLength(1);
  expect(validations[0][0]).toBe((input.source as XMLSourceReference).element);
  expect(validations[0][1]).toBe(scope);
  expect(validations[0][2]).toBe(node.content());
  expect(node.content().raw()).toBe('Hello {name}');
});

it('uses an explicit content-text attribute before the element content fallback', () => {
  const definition = new Node({ name: 'label' });
  definition.addAttribute(new ContentTextAttribute({ name: 'title' }));
  const node = definition.parseTree({
    ...xmlInput('<label title="$:getLabel()">Fallback</label>'),
    scope: { getReference: () => null },
    report: () => {}
  });
  expect(node.content()).toBeUndefined();
  expect(node.attribute('title').stringify()).toEqual({ isAttribute: true, value: '$:getLabel()' });
});
