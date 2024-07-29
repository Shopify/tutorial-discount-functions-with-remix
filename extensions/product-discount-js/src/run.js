// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Target} Target
 * @typedef {import("../generated/api").ProductVariant} ProductVariant
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  // [START function-configuration.parse-metafield]
  /**
   * @type {{
   *   quantity: number
   *   percentage: number
   * }}
   */
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}",
  );
  if (!configuration.quantity || !configuration.percentage) {
    return EMPTY_DISCOUNT;
  }
  // [END function-configuration.parse-metafield]
  const targets = input.cart.lines
    // [START function-configuration.use-metafield]
    .filter((line) => line.quantity >= configuration.quantity)
    // [END function-configuration.parse-metafield]
    .map((line) => {
      return /** @type {Target} */ ({
        cartLine: {
          id: line.id,
        },
      });
    });

  if (!targets.length) {
    console.error("No cart lines qualify for volume discount.");
    return EMPTY_DISCOUNT;
  }

  return {
    discounts: [
      {
        targets,
        value: {
          // [START function-configuration.use-metafield]
          percentage: {
            value: configuration.percentage.toString(),
          },
          // [END function-configuration.use-metafield]
        },
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}
