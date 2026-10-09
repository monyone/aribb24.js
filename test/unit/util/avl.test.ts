import AVLTree from '@/util/avl';
import { describe, test, expect } from 'vitest';

const compareNumber = (a: number, b: number) => {
  return Math.sign(a - b) as (-1 | 0 | 1);
}

describe("AVL", () => {
  test('Insert', () => {
    const avl = new AVLTree<number, number>(compareNumber, compareNumber, (val) => val);

    const data = Array.from({ length: 100}, (_, i) => i);
    for (const datum of data) {
      avl.insert(datum, datum);
    }

    for (const datum of data) {
      expect(avl.get(datum)).toStrictEqual(datum);
    }
  });

  test('Delete', () => {
    const avl = new AVLTree<number, number>(compareNumber, compareNumber, (val) => val);

    const data = Array.from({ length: 120 }, (_, i) => Math.floor(Math.random() * 120));
    for (let i = 0; i < data.length; i++) {
      avl.insert(data[i], data[i]);
    }
    for (let i = 0; i < data.length; i += 4) {
      avl.delete(data[i]);
    }

    for (let i = 0; i < data.length; i += 4) {
      expect(avl.get(data[i])).toStrictEqual(undefined);
    }
  });

  test('Floor/Ceil against brute-force reference', () => {
    const avl = new AVLTree<number, number>(compareNumber, compareNumber, (val) => val);
    const keys = Array.from({ length: 64 }, (_, i) => i * 3);
    for (const key of keys) {
      avl.insert(key, key);
    }

    const expectedFloor = (query: number): number | undefined => {
      let best: number | undefined = undefined;
      for (const key of keys) {
        if (key <= query && (best === undefined || key > best)) { best = key; }
      }
      return best;
    };
    const expectedCeil = (query: number): number | undefined => {
      let best: number | undefined = undefined;
      for (const key of keys) {
        if (key >= query && (best === undefined || key < best)) { best = key; }
      }
      return best;
    };

    for (let query = -2; query <= keys[keys.length - 1] + 2; query++) {
      expect(avl.floor(query)).toStrictEqual(expectedFloor(query));
      expect(avl.ceil(query)).toStrictEqual(expectedCeil(query));
    }
  });

  test('Lower/Upper against brute-force reference', () => {
    const avl = new AVLTree<number, number>(compareNumber, compareNumber, (val) => val);
    const keys = Array.from({ length: 64 }, (_, i) => i * 3);
    for (const key of keys) {
      avl.insert(key, key);
    }

    const expectedLower = (query: number): number | undefined => {
      let best: number | undefined = undefined;
      for (const key of keys) {
        if (key < query && (best === undefined || key > best)) { best = key; }
      }
      return best;
    };
    const expectedUpper = (query: number): number | undefined => {
      let best: number | undefined = undefined;
      for (const key of keys) {
        if (key > query && (best === undefined || key < best)) { best = key; }
      }
      return best;
    };

    for (let query = -2; query <= keys[keys.length - 1] + 2; query++) {
      expect(avl.lower(query)).toStrictEqual(expectedLower(query));
      expect(avl.upper(query)).toStrictEqual(expectedUpper(query));
    }
  });
});
