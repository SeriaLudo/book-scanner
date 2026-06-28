export const BOOK_CONDITIONS = [
  {value: 'new', label: 'New'},
  {value: 'like_new', label: 'Like New'},
  {value: 'very_good', label: 'Very Good'},
  {value: 'good', label: 'Good'},
  {value: 'acceptable', label: 'Acceptable'},
] as const;

export const BOOK_FORMATS = [
  {value: 'hardcover', label: 'Hardcover'},
  {value: 'paperback', label: 'Paperback'},
  {value: 'trade_paperback', label: 'Trade Paperback'},
  {value: 'mass_market_paperback', label: 'Mass Market Paperback'},
  {value: 'other', label: 'Other'},
] as const;

export type BookCondition = (typeof BOOK_CONDITIONS)[number]['value'];
export type BookFormat = (typeof BOOK_FORMATS)[number]['value'];

export const DEFAULT_BOOK_CONDITION: BookCondition = 'good';
export const DEFAULT_BOOK_FORMAT: BookFormat = 'paperback';

export function getConditionLabel(condition: BookCondition) {
  return BOOK_CONDITIONS.find((item) => item.value === condition)?.label ?? condition;
}

export function getFormatLabel(format: BookFormat) {
  return BOOK_FORMATS.find((item) => item.value === format)?.label ?? format;
}
