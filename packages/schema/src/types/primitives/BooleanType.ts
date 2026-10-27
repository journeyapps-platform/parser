import { BooleanType as ValueBooleanType } from '@ja-platform/parser-type-system';
import { withChoices } from './ChoiceType';

export class BooleanType extends withChoices(ValueBooleanType) {}
