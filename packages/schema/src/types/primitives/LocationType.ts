import { ObjectType, Type } from '@ja-platform/parser-type-system';
import { TextType } from './TextType';

export class LocationType extends ObjectType {
  static readonly TYPE = 'location';

  constructor() {
    super(LocationType.TYPE);
  }

  getField(name: string): Type | null {
    return ['latitude', 'longitude', 'altitude', 'horizontal_accuracy', 'vertical_accuracy'].includes(name)
      ? new TextType()
      : null;
  }
}
