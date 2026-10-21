import { AttachmentType } from './attachments/AttachmentType';
import { TextType } from './TextType';
import { BooleanType } from './BooleanType';
import { LocationType } from './LocationType';
import { GeoTrackType } from './GeoTrackType';
import { SingleChoiceType } from './SingleChoiceType';
import { SingleChoiceIntegerType } from './SingleChoiceIntegerType';
import { MultipleChoiceType } from './MultipleChoiceType';
import { MultipleChoiceIntegerType } from './MultipleChoiceIntegerType';
import { IntegerType, NumberType } from '@ja-platform/parser-type-system';
import { DateType } from './DateType';
import { DatetimeType } from './DatetimeType';
import { PhotoType } from './attachments/PhotoType';
import { SignatureType } from './attachments/SignatureType';

export const PrimitiveType = {
  ATTACHMENT: AttachmentType.TYPE,
  BOOLEAN: BooleanType.TYPE,
  DATE: DateType.TYPE,
  DATETIME: DatetimeType.TYPE,
  GEO_TRACK: GeoTrackType.TYPE,
  INTEGER: IntegerType.TYPE,
  LOCATION: LocationType.TYPE,
  MULTIPLE_CHOICE_INTEGER: MultipleChoiceIntegerType.TYPE,
  MULTIPLE_CHOICE: MultipleChoiceType.TYPE,
  NUMBER: NumberType.TYPE,
  SINGLE_CHOICE_INTEGER: SingleChoiceIntegerType.TYPE,
  SINGLE_CHOICE: SingleChoiceType.TYPE,
  TEXT: TextType.TYPE,
  PHOTO: PhotoType.SUB_TYPE,
  SIGNATURE: SignatureType.SUB_TYPE
} as const;
export type PrimitiveType = typeof PrimitiveType;

// Collection of primitive types.
// Each type is a constructor creating a default instance of that type.
export const PrimitiveTypeMap = {
  [PrimitiveType.ATTACHMENT]: AttachmentType,
  [PrimitiveType.BOOLEAN]: BooleanType,
  [PrimitiveType.DATE]: DateType,
  [PrimitiveType.DATETIME]: DatetimeType,
  [PrimitiveType.GEO_TRACK]: GeoTrackType,
  [PrimitiveType.INTEGER]: IntegerType,
  [PrimitiveType.LOCATION]: LocationType,
  [PrimitiveType.MULTIPLE_CHOICE_INTEGER]: MultipleChoiceIntegerType,
  [PrimitiveType.MULTIPLE_CHOICE]: MultipleChoiceType,
  [PrimitiveType.NUMBER]: NumberType,
  [PrimitiveType.SINGLE_CHOICE_INTEGER]: SingleChoiceIntegerType,
  [PrimitiveType.SINGLE_CHOICE]: SingleChoiceType,
  [PrimitiveType.TEXT]: TextType,
  [PrimitiveType.SIGNATURE]: SignatureType,
  [PrimitiveType.PHOTO]: PhotoType
} as const;

export type PrimitiveTypeMap = typeof PrimitiveTypeMap;

// Collection of primitive type names
export type PrimitiveTypeName = keyof typeof PrimitiveTypeMap;

export type PrimitiveTypeInstance = InstanceType<PrimitiveTypeMap[PrimitiveTypeName]>;
