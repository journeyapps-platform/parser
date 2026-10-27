import { Param } from '@ja-platform/parser-schema';
import type { Type } from '@ja-platform/parser-type-system';
import type { XMLElement } from '@journeyapps/domparser/types';

export class XmlParam<T extends Type = Type> extends Param<T> {
  sourceElement?: XMLElement;
  readonly optionSources = new Map<string, XMLElement>();
}
