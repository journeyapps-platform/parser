import {
  EvaluatedExpressionParser,
  FormatStringExpressionParser,
  ConstantExpression,
  FunctionExpression
} from '@ja-platform/parser-expressions';
import { numberType, booleanType, textType } from '@ja-platform/parser-type-system';
import { expect, expectTypeOf, it } from 'vitest';
import { parse } from '@journeyapps/common-xml';
import { V5Node, V5ContentNode, V5ContentTextAttribute, ConstantExpressionValueProvider } from '../src';

it('parses element content using the declared value type and serializes its original text', () => {
  const definition = new V5ContentNode({ name: 'timeout', valueType: numberType });
  const element = parse('<timeout content="99">30</timeout>').documentElement;
  const node = definition.parseTree({
    event: {
      element,
      scope: { getReference: () => null },
      helper: { pushError: () => {} }
    }
  });

  expect(node.content().raw()).toBe('30');
  expect(node.attribute('content').stringify()).toEqual({ isAttribute: false, value: '30' });
  expect(node.attribute('content').sourceElement).toBe(element);
});

it('reports invalid typed content at the content element', () => {
  const definition = new V5ContentNode({ name: 'timeout', valueType: numberType });
  const element = parse('<timeout>invalid</timeout>').documentElement;
  const node = definition.parseTree({
    event: {
      element,
      scope: { getReference: () => null },
      helper: { pushError: () => {} }
    }
  });
  const attribute = node.attribute('content');

  expect(attribute.expression()).toBeNull();
  expect(attribute.errors()).toHaveLength(1);
  expect(attribute.sourceElement).toBe(element);
});

it.each(['Hello {name}', '$:getLabel()', '45', ''])('defaults content nodes to literal text for %j', (text) => {
  const definition = new V5ContentNode({ name: 'label', valueType: textType });
  const element = parse(`<label>${text}</label>`).documentElement;
  const node = definition.parseTree({
    event: {
      element,
      scope: { getReference: () => null },
      helper: { pushError: () => {} }
    }
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
  const definition = new V5Node({ name: 'label' });
  definition.addAttribute(new V5ContentTextAttribute({ name: 'title' }));
  const element = parse('<label>$:getLabel()</label>').documentElement;
  const node = definition.parseTree({
    event: {
      element,
      scope: { getReference: () => null },
      helper: { pushError: () => {} }
    }
  });
  const attribute = node.attribute('title');

  expect(node.content()).toBe(attribute.expression());
  expect(node.content()).toBeInstanceOf(FunctionExpression);
  expect(node.content().raw()).toBe('$:getLabel()');
  expect(attribute.stringify()).toEqual({ isAttribute: false, value: '$:getLabel()' });
  expect(attribute.sourceElement).toBe(element);
});

it('parses explicit boolean content', () => {
  const definition = new V5ContentNode({ name: 'enabled', valueType: booleanType });
  const element = parse('<enabled>false</enabled>').documentElement;
  const node = definition.parseTree({
    event: {
      element,
      scope: { getReference: () => null },
      helper: {
        pushError: () => {}
      }
    }
  });
  expectTypeOf(node.content()).toEqualTypeOf<ConstantExpression<boolean> | undefined>();
  expect(node.content().value()).toBe(false);
  expect(node.attribute('content').stringify()).toEqual({ isAttribute: false, value: 'false' });
});

it('accepts explicitly selected evaluated syntax while retaining its source and resolved value type', () => {
  const definition = new V5ContentNode({
    name: 'timeout',
    valueType: numberType,
    syntax: new EvaluatedExpressionParser()
  });
  const node = definition.parseTree({
    event: {
      element: parse('<timeout>$:getTimeout()</timeout>').documentElement,
      scope: { getReference: () => null },
      helper: { pushError: () => {} }
    }
  });
  expect(node.content().code()).toBe('getTimeout()');
  expect(node.attribute('content').stringify()).toEqual({ isAttribute: false, value: '$:getTimeout()' });
  expect(node.attribute('content').definition.normalizeValue('045')).toBe(45);
});

it('validates explicitly selected format syntax as element content', () => {
  const element = parse('<label>Hello {name}</label>').documentElement;
  const scope = { getReference: () => null };
  const validations: Array<[unknown, unknown, unknown]> = [];
  const definition = new V5ContentNode({
    name: 'label',
    valueType: textType,
    syntax: new FormatStringExpressionParser()
  });
  const node = definition.parseTree({
    event: {
      element,
      scope,
      helper: {
        pushError: () => {},
        validateFormatContent: ({ element, scope, expression }) => validations.push([element, scope, expression]),
        validateFormatAttribute: () => {
          throw new Error('Unexpected attribute validation');
        }
      }
    }
  });
  expect(validations).toHaveLength(1);
  expect(validations[0][0]).toBe(element);
  expect(validations[0][1]).toBe(scope);
  expect(validations[0][2]).toBe(node.content());
  expect(node.content().raw()).toBe('Hello {name}');
});

it('uses an explicit content-text attribute before the element content fallback', () => {
  const definition = new V5Node({ name: 'label' });
  definition.addAttribute(new V5ContentTextAttribute({ name: 'title' }));
  const node = definition.parseTree({
    event: {
      element: parse('<label title="$:getLabel()">Fallback</label>').documentElement,
      scope: { getReference: () => null },
      helper: { pushError: () => {} }
    }
  });
  expect(node.content()).toBeUndefined();
  expect(node.attribute('title').stringify()).toEqual({ isAttribute: true, value: '$:getLabel()' });
});
