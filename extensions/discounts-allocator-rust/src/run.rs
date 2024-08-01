// [START discounts-allocator.run-configuration]
use shopify_function::prelude::*;
use shopify_function::Result;

// Define constants for error messages
const TOTAL_DISCOUNTS_CAP_REACHED: &str = "Maximum discount limit reached for this cart";
const SINGLE_DISCOUNT_CAP_REACHED: &str = "Maximum discount limit reached for this discount";

// [START discounts-allocator.run-entrypoint]
#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {

    // [START discounts-allocator.helper-functions]
    // Helper function to extract the line index from a target's cartLineId
    fn get_target_line_index(target: &input::InputDiscountsDiscountProposalsTargets) -> usize {
      target
          .cart_line_id
          .chars()
          .last()
          .unwrap()
          .to_digit(10)
          .unwrap() as usize
    }

    // Helper function to calculate the price for a specific target based on its quantity
    fn calculate_current_target_price(
      input_cart_lines: &Vec<input::InputCartLines>,
      target: &input::InputDiscountsDiscountProposalsTargets,
    ) -> f64 {
      let target_line_index = get_target_line_index(target);
      let target_line = &input_cart_lines[target_line_index];
      f64::from(target_line.cost.amount_per_quantity.amount) * target.quantity as f64
    }
    // [END discounts-allocator.helper-functions]
    // Parse the total discounts cap from the shop's metafield
    let total_discounts_cap: f64 = input
        .shop
        .metafield
        .unwrap_or(input::InputShopMetafield {
            value: String::from("-1"),
        })
        .value
        .parse()
        .unwrap();

    let mut total_discount = 0.0;

    // Initialize the output structure for line discounts
    let mut all_lines_output_discounts = input
        .cart
        .lines
        .iter()
        .map(|line| output::LineDiscount {
            cart_line_id: line.id.clone(),
            quantity: line.quantity,
            allocations: vec![],
        })
        .collect::<Vec<output::LineDiscount>>();

    let mut displayable_errors = vec![];

    // Process each discount in the input
    if let Some(discounts) = input.discounts {
        for discount in discounts.iter() {
            // Parse the cap for the current discount from its metafield
            let current_discount_cap: f64 = discount
                .metafield
                .clone()
                .unwrap_or(input::InputDiscountsMetafield {
                    value: String::from("-1"),
                })
                .value
                .parse()
                .unwrap();

            let mut current_discount_total = 0.0;

            // Process each discount proposal within the current discount
            for proposal in discount.discount_proposals.iter() {
                let total_targets_price = proposal.targets.iter().fold(0.0, |total, target| {
                    total + calculate_current_target_price(&input.cart.lines, &target)
                });

                for target in proposal.targets.iter() {
                    let current_target_price =
                        calculate_current_target_price(&input.cart.lines, &target);
                    let current_target_ratio = current_target_price / total_targets_price;

                    let mut line_discount_amount: f64;

                    // Calculate the discount amount based on the type of discount
                    match &proposal.value {
                        input::InputDiscountsDiscountProposalsValue::FixedAmount(
                            fixed_amount_proposal,
                        ) => {
                            if fixed_amount_proposal.applies_to_each_item {
                                line_discount_amount = f64::from(fixed_amount_proposal.amount)
                                    * target.quantity as f64;
                            } else {
                                line_discount_amount =
                                    f64::from(fixed_amount_proposal.amount) * current_target_ratio;
                            }
                        }
                        input::InputDiscountsDiscountProposalsValue::Percentage(
                            percentage_proposal,
                        ) => {
                            line_discount_amount = f64::from(percentage_proposal.value) / 100.0
                                * total_targets_price
                                * current_target_ratio;
                        }
                    }

                    // Check and apply caps on the discount amount
                    if current_discount_cap >= 0.0
                        && current_discount_total + line_discount_amount > current_discount_cap
                    {
                        line_discount_amount = current_discount_cap - current_discount_total;
                        displayable_errors.push(output::DisplayableError {
                            discount_id: discount.id.to_string(),
                            reason: SINGLE_DISCOUNT_CAP_REACHED.to_string(),
                        });
                    }

                    if total_discounts_cap >= 0.0
                        && total_discount + line_discount_amount > total_discounts_cap
                    {
                        line_discount_amount = total_discounts_cap - total_discount;
                        displayable_errors.push(output::DisplayableError {
                            discount_id: discount.id.to_string(),
                            reason: TOTAL_DISCOUNTS_CAP_REACHED.to_string(),
                        });
                    }

                    if line_discount_amount == 0.0 {
                        continue;
                    }

                    total_discount += line_discount_amount;
                    current_discount_total += line_discount_amount;

                    let target_line_index = get_target_line_index(target);
                    let target_allocation = output::OutputAllocations {
                        discount_proposal_id: proposal.handle.clone(),
                        amount: shopify_function::prelude::Decimal(line_discount_amount),
                    };

                    all_lines_output_discounts[target_line_index]
                        .allocations
                        .push(target_allocation);
                }
            }
        }
    }

    // Filter out lines that have no allocations
    let line_discounts = all_lines_output_discounts
        .into_iter()
        .filter(|output_discount| output_discount.allocations.len() > 0)
        .collect::<Vec<output::LineDiscount>>();

    // Remove duplicate errors
    displayable_errors.dedup();

    let output = output::FunctionRunResult {
        line_discounts: Some(line_discounts),
        displayable_errors: Some(displayable_errors),
    };

    Ok(output)
}
// [END discounts-allocator.run-entrypoint]
// [END discounts-allocator.run-configuration]
