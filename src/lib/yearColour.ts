export const YEAR_COLOUR_DEFAULT = 'border-gray-300';

export const YEAR_COLOUR: Record<string, string> = {
  '1': 'border-green-500',
  '2': 'border-blue-500',
  '3': 'border-yellow-500',
  '4': 'border-red-500',
};

export function yearColour(code: string): string {
  const digit = code.match(/\d/)?.[0];
  return (digit && YEAR_COLOUR[digit]) ?? YEAR_COLOUR_DEFAULT;
}
