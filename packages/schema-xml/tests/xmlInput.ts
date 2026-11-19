import { parse } from '@journeyapps/common-xml';
import { XMLNodeInput } from '@ja-platform/parser-document-xml';

export function xmlInput(source: string) {
  const document = parse(source);
  if (document.errors?.length) throw new Error(document.errors.map((error) => error.toString()).join('\n'));
  return {
    input: new XMLNodeInput(document.documentElement, source)
  };
}
