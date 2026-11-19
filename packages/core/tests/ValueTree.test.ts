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
  const nodeContext = { providers: [new ParserDefaultValueProvider(), new ConstantExpressionValueProvider(), mutable] };
  return { node, mutable, context: nodeContext };
}

it('resolves typed attributes, descendants and repeated children through providers', () => {
  const { node, context } = setup();
  const values = node.valueTree(context);
  expect(values.current).toEqual({
    enabled: true,
    name: 'Hello {name}',
    group: { timeout: 30, items: [{ label: 'first' }, { label: 'second' }] },
    scores: [10, 20]
  });
  values.dispose();
});

it('updates nested values and disposes only the tree-owned evaluations', () => {
  const { node, mutable, context } = setup();
  const tree = node.valueTree(context);
  const timeoutNode = node.node('group').node('timeout');
  const treeContribution = mutable.values.get(timeoutNode.attribute('content'));
  const treeDisposed = vi.fn();
  treeContribution.registerListener({ disposed: treeDisposed });
  const timeout = timeoutNode.valueTree(context);
  const independentContribution = mutable.values.get(timeoutNode.attribute('content'));
  const independentDisposed = vi.fn();
  independentContribution.registerListener({ disposed: independentDisposed });
  const changed = vi.fn();
  tree.registerListener({ changed });
  treeContribution.setValue('045');
  treeContribution.setActive(true);
  expect(tree.current.group.timeout).toBe(45);
  expect(timeout.current).toBe(30);
  expect(changed).toHaveBeenCalledOnce();
  tree.dispose();
  tree.dispose();
  expect(treeDisposed).toHaveBeenCalledOnce();
  expect(independentDisposed).not.toHaveBeenCalled();
  independentContribution.setValue(60);
  independentContribution.setActive(true);
  expect(timeout.current).toBe(60);
  expect(tree.current.group.timeout).toBe(45);
  expect(changed).toHaveBeenCalledOnce();
  timeout.dispose();
  expect(independentDisposed).toHaveBeenCalledOnce();
  context.providers.forEach((provider) => provider.dispose());
});

it.each([
  { name: 'equal nested values', before: { items: [{ count: 1 }] }, after: { items: [{ count: 1 }] }, changed: false },
  { name: 'changed nested values', before: { items: [{ count: 1 }] }, after: { items: [{ count: 2 }] }, changed: true },
  { name: 'equal dates', before: new Date(0), after: new Date(0), changed: false },
  { name: 'changed dates', before: new Date(0), after: new Date(1), changed: true },
  { name: 'different containers', before: {}, after: [], changed: true }
])('notifies aggregate consumers according to $name', ({ before, after, changed }) => {
  const source = new ParsedProviderValue<unknown>({ active: true, value: before });
  const values = new ParsedNodeValues<unknown>([source], ([value]) => value);
  const listener = vi.fn();
  values.registerListener({ changed: listener });
  source.setValue(after);
  expect(listener).toHaveBeenCalledTimes(changed ? 1 : 0);
  expect(values.current).toBe(changed ? after : before);
  values.dispose();
});
