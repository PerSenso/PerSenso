import { describe, it, expect } from 'vitest';
import { fuzzyMatch } from './fuzzy-search';

describe('fuzzyMatch', () => {
  it('coincidencia exacta retorna true', () => {
    expect(fuzzyMatch('Chanel No 5', 'Chanel No 5')).toBe(true);
  });

  it('coincidencia parcial (substring) retorna true', () => {
    expect(fuzzyMatch('Chanel No 5', 'Chanel')).toBe(true);
  });

  it('typo con distancia 1 sigue encontrando el producto', () => {
    // "Chanel" vs "Chaneel" — distancia Levenshtein 1
    expect(fuzzyMatch('Chaneel', 'Chanel')).toBe(true);
  });

  it('sin coincidencia si distancia > umbral', () => {
    expect(fuzzyMatch('Chanel', 'ZZZZZZ')).toBe(false);
  });

  it('búsqueda case-insensitive', () => {
    expect(fuzzyMatch('Chanel No 5', 'chanel')).toBe(true);
    expect(fuzzyMatch('CHANEL', 'chanel')).toBe(true);
  });
});
