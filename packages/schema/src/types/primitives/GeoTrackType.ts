import { Type } from '@ja-platform/parser-type-system';

export class GeoTrackType extends Type {
  static readonly TYPE = 'track';

  constructor() {
    super(GeoTrackType.TYPE);
  }
}
