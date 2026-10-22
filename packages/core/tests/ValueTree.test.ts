import { xmlInput } from './xmlInput';
import { numberType, textType } from '@ja-platform/parser-type-system';
import { expect, it, vi } from 'vitest';
import {
  AbstractValueProvider,
  ConstantExpressionValueProvider,
  ParsedAttribute,
  ParsedProviderValue,
  ParsedNodeValues,
  ParserDefaultValueProvider,
  Node,
  ContentNode,
  ConstantTextAttribute,
  BooleanAttribute
} from '../src';

class MutableProvider extends AbstractValueProvider {
  readonly values = new Map<ParsedAttribute, ParsedProviderValue<any>>();

  protected createProviderValue<T>(attribute: ParsedAttribute): ParsedProviderValue<T> {
    const value = new ParsedProviderValue<T>({ active: false, provider: this });
    this.values.set(attribute, value);
    return value;
  }
}

function setup() {
  const item = new Node({ name: 'item', key: 'items', isMultiple: true });
  item.addAttribute(new ConstantTextAttribute({ name: 'label' }));
  const definition = new Node({ name: 'resource' });
  definition.addAttribute(new BooleanAttribute({ name: 'enabled' }));
  definition.addNode(new ContentNode({ name: 'name', valueType: textType }));
  const group = new Node({ name: 'group' });
  group.addNode(new ContentNode({ name: 'timeout', valueType: numberType }));
  group.addNode(item);
  definition.addNode(group);
  definition.addNode(new ContentNode({ name: 'score', key: 'scores', valueType: numberType, isMultiple: true }));
  definition.addNode(new Node({ name: 'absent' }));
  const node = definition.parseTree({
    ...xmlInput(
      '<resource enabled="true"><name>Hello {name}</name><group><timeout>30</timeout><item label="first" /><item label="second" /></group><score>10</score><score>20</score></resource>'
    ),
    report: ({ message }) => {
      throw new Error(message);
    }
  });
  const mutable = new MutableProvider();
  node.setValueProviders([new ParserDefaultValueProvider(), new ConstantExpressionValueProvider(), mutable]);
  return { node, mutable };
}

it('resolves typed attributes, descendants and repeated children through providers', () => {
  const { node } = setup();
  const values = node.valueTree();
  expect(values.current).toEqual({
    enabled: true,
    name: 'Hello {name}',
    group: { timeout: 30, items: [{ label: 'first' }, { label: 'second' }] },
    scores: [10, 20]
  });
  values.dispose();
});

it('updates deep values and releases the tree without releasing another consumer', () => {
  const { node, mutable } = setup();
  const tree = node.valueTree();
  const attributes = node.value(['enabled']);
  const timeoutNode = node.node('group').node('timeout');
  const timeout = timeoutNode.valueTree();
  const contribution = mutable.values.get(timeoutNode.attribute('content'));
  const changed = vi.fn();
  const disposed = vi.fn();
  tree.registerListener({ changed });
  mutable.values.forEach((value) => value.registerListener({ disposed }));

  contribution.setValue('045');
  contribution.setActive(true);
  expect(tree.current.group.timeout).toBe(45);
  expect(changed).toHaveBeenCalledTimes(1);

  tree.dispose();
  tree.dispose();
  expect(disposed).toHaveBeenCalledTimes(mutable.values.size - 2);
  contribution.setValue(60);
  expect(timeout.current).toBe(60);
  expect(tree.current.group.timeout).toBe(45);
  expect(changed).toHaveBeenCalledTimes(1);
  const enabled = mutable.values.get(node.attribute('enabled'));
  enabled.setValue(false);
  enabled.setActive(true);
  expect(attributes.current.enabled).toBe(false);
  expect(tree.current.enabled).toBe(true);
  timeout.dispose();
  expect(disposed).toHaveBeenCalledTimes(mutable.values.size - 1);
  attributes.dispose();
  expect(disposed).toHaveBeenCalledTimes(mutable.values.size);
});

it.each([
  { name: 'equal nested values', before: { items: [{ count: 1 }] }, after: { items: [{ count: 1 }] }, changed: false },
  { name: 'changed nested values', before: { items: [{ count: 1 }] }, after: { items: [{ count: 2 }] }, changed: true },
  { name: 'equal dates', before: new Date(0), after: new Date(0), changed: false },
  { name: 'changed dates', before: new Date(0), after: new Date(1), changed: true },
  { name: 'different containers', before: {}, after: [], changed: true }
])('notifies aggregate consumers according to $name', ({ before, after, changed }) => {
  const values = new ParsedNodeValues<unknown>([], () => before);
  const listener = vi.fn();
  values.registerListener({ changed: listener });
  values.update(after);
  expect(listener).toHaveBeenCalledTimes(changed ? 1 : 0);
  expect(values.current).toBe(changed ? after : before);
  values.dispose();
});
