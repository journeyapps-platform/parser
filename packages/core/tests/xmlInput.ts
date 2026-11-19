import { parse } from '@journeyapps/common-xml';
import { XMLNodeInput } from '../../document-xml/src/XMLNodeInput';

export function xmlInput(source: string) {
  const document = parse(source);
  if (document.errors?.length) throw new Error(document.errors.map((error) => error.toString()).join('\n'));
  return {
    input: new XMLNodeInput(document.documentElement, source)
  };
}
