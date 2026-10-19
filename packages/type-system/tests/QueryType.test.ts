import { expect, it } from 'vitest';
import { ObjectType, QueryType } from '../src';

class RecordType extends ObjectType {
  getField() {
    return null;
  }
}

it('accepts queries for the declared object type without executing them', () => {
  const type = new QueryType(new RecordType('asset'));
  const query = {
    type: new RecordType('asset'),
    _fetch: () => {
      throw new Error('Must not execute');
    }
  };
  expect(type.parse(query)).toBe(query);
  for (const value of [null, {}, { type: query.type }, { ...query, type: new RecordType('room') }]) {
    expect(type.is(value)).toBe(false);
    expect(() => type.parse(value)).toThrow('Expected value to have query type asset');
  }
});
