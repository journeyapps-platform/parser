import type { TextAttributeInput } from './input/AttributeInput';
import type { AttributeParseContext } from './input/AttributeParseContext';

export interface AttributeParseEvent {
  input: TextAttributeInput;
  context?: AttributeParseContext;
}
