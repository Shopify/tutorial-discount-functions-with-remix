// [START discounts-allocator.run-configuration]
import { Decimal } from "decimal.js";

const TOTAL_DISCOUNTS_CAP_REACHED =
  "Maximum discount limit reached for this cart";
const SINGLE_DISCOUNT_CAP_REACHED =
  "Maximum discount limit reached for this discount";

// Helper function to extract the line index from a target's cartLineId
function getTargetLineIndex(target) {
  return parseInt(target.cartLineId.slice(-1));
}

// Helper function to calculate the price for a specific target based on its quantity
function calculateCurrentTargetPrice(inputCartLines, target) {
  const targetLineIndex = getTargetLineIndex(target);
  const targetLine = inputCartLines[targetLineIndex];
  return targetLine.cost.amountPerQuantity.amount * target.quantity;
}

// [START discounts-allocator.run-entrypoint]
export function run(input) {
  // Read the total discounts cap from the shop's metafield, defaulting to -1 if not set
  let totalDiscountsCap = parseFloat(input.shop.metafield?.value ?? "-1");
  let totalDiscount = 0.0;

  // Initialize the output structure for line discounts
  let allLinesOutputDiscounts = input.cart.lines.map((line) => ({
    cartLineId: line.id,
    quantity: line.quantity,
    allocations: [],
  }));
  let displayableErrors = [];

  // Iterate over each discount in the input
  for (const discount of input.discounts) {
    // Read the cap for the current discount from its metafield, defaulting to -1 if not set
    let currentDiscountCap = parseFloat(discount.metafield?.value ?? "-1");
    let currentDiscountTotal = 0.0;

    // Process each discount proposal within the current discount
    for (const proposal of discount.discountProposals) {
      // Calculate the total price of all targets affected by the current proposal
      const totalTargetsPrice = proposal.targets.reduce((total, target) => {
        return total + calculateCurrentTargetPrice(input.cart.lines, target);
      }, 0);

      // Apply the discount to each target
      for (const target of proposal.targets) {
        const currentTargetPrice = calculateCurrentTargetPrice(
          input.cart.lines,
          target,
        );
        const currentTargetRatio = currentTargetPrice / totalTargetsPrice;

        let lineDiscountAmount = 0.0;
        if (proposal.value.__typename == "FixedAmount") {
          if (proposal.value.appliesToEachItem) {
            lineDiscountAmount = proposal.value.amount * target.quantity;
          } else {
            lineDiscountAmount = proposal.value.amount * currentTargetRatio;
          }
        } else if (proposal.value.__typename == "Percentage") {
          lineDiscountAmount =
            (proposal.value.value / 100.0) *
            totalTargetsPrice *
            currentTargetRatio;
        }

        // Check and apply caps on the discount amount
        if (
          currentDiscountCap >= 0.0 &&
          currentDiscountTotal + lineDiscountAmount > currentDiscountCap
        ) {
          lineDiscountAmount = currentDiscountCap - currentDiscountTotal;
          displayableErrors.push({
            discountId: discount.id.toString(),
            reason: SINGLE_DISCOUNT_CAP_REACHED,
          });
        }

        if (
          totalDiscountsCap >= 0.0 &&
          totalDiscount + lineDiscountAmount > totalDiscountsCap
        ) {
          lineDiscountAmount = totalDiscountsCap - totalDiscount;
          displayableErrors.push({
            discountId: discount.id.toString(),
            reason: TOTAL_DISCOUNTS_CAP_REACHED,
          });
        }

        if (lineDiscountAmount === 0.0) {
          continue;
        }

        totalDiscount += lineDiscountAmount;
        currentDiscountTotal += lineDiscountAmount;

        const targetLineIndex = getTargetLineIndex(target);
        const targetAllocation = {
          discountProposalId: proposal.handle,
          amount: new Decimal(lineDiscountAmount),
        };
        allLinesOutputDiscounts[targetLineIndex].allocations.push(
          targetAllocation,
        );
      }
    }
  }

  // Filter out lines that have no allocations
  const lineDiscounts = allLinesOutputDiscounts.filter(
    (outputDiscount) => outputDiscount.allocations.length > 0,
  );

  // Prepare the final output structure
  const output = {
    lineDiscounts,
    displayableErrors,
  };

  return output;
}
// [END discounts-allocator.run-entrypoint]
// [END discounts-allocator.run-configuration]
