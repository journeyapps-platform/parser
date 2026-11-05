export const ATTACHMENT_MEDIA_TYPES = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/msword',
  'application/vnd.anritsu',
  'application/vnd.valvelink',
  'application/xml',
  'text/plain',
  'text/csv',
  'any'
];

export const textSubtypeSpecs: { [index: string]: string } = {
  email: 'text.email',
  address: 'text.address',
  name: 'text.name',
  url: 'text.url',
  paragraph: 'text.paragraph',
  'signed-number': 'number',
  number: 'number', // TODO: fix
  'south-african-id': 'number.za_id',
  'phone-number': 'phone',
  'decimal-number': 'decimal',
  password: 'password'
};

export const TEXT_SUBTYPES = Object.keys(textSubtypeSpecs);
