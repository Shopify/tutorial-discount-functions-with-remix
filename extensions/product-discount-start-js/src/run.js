// [START product-discount-start]
// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

// Use JSDoc annotations for type safety
/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Target} Target
 * @typedef {import("../generated/api").ProductVariant} ProductVariant
 */

// [START product-discount-start-js.empty-discount]
/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};
// [END product-discount-start-js.empty-discount]
// [START product-discount-start.entrypoint]
/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  // [END product-discount-start.entrypoint]
  // [START product-discount-start.cart-targets]
  const targets = input.cart.lines
    // Only include cart lines with a quantity of two or more
    .filter((line) => line.quantity >= 2)
    .map((line) => {
      return /** @type {Target} */ ({
        // Use the cart line ID to create a discount target
        cartLine: {
          id: line.id,
        },
      });
    });
  // [END product-discount-start.cart-targets]
  if (!targets.length) {
    // You can use STDERR for debug logs in your function
    console.error("No cart lines qualify for volume discount.");
    return EMPTY_DISCOUNT;
  }

  // [START product-discount-start.discount]
  return {
    discounts: [
      {
        // Apply the discount to the collected targets
        targets,
        // Define a percentage-based discount
        value: {
          percentage: {
            value: "10.0",
          },
        },
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
  // [END product-discount-start.discount]
}
// [END product-discount-start]
