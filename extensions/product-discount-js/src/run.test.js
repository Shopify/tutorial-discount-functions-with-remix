import { describe, it, expect } from 'vitest';
import { run } from './run';

/**
 * @typedef {import("../generated/api").FunctionResult} FunctionResult
 */

describe('product discounts function', () => {
  it('returns no discounts without configuration', () => {
    const result = run({
      discountNode: {
        metafield: null
      }
    });
    const expected = /** @type {FunctionResult} */ ({
      discounts: [],
      discountApplicationStrategy: "FIRST",
    });

    expect(result).toEqual(expected);
  });
});