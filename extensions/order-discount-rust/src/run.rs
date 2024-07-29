// [START order-discount.run-configuration]
use shopify_function::prelude::*;
use shopify_function::Result;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, PartialEq)]
#[serde(rename_all(deserialize = "camelCase"))]

struct Configuration {
    pub minimum_amount: i64,
    pub percentage: f64,
}

impl Configuration {
    const DEFAULT_MINIMUM_AMOUNT: i64 = 999;
    const DEFAULT_PERCENTAGE: f64 = 0.0;

    fn from_str(value: &str) -> Self {
        serde_json::from_str(value).expect("Unable to parse configuration value from metafield")
    }
}

impl Default for Configuration {
    fn default() -> Self {
        Configuration {
            minimum_amount: Self::DEFAULT_MINIMUM_AMOUNT,
            percentage: Self::DEFAULT_PERCENTAGE,
        }
    }
}

#[shopify_function_target(query_path = "src/run.graphql", schema_path = "schema.graphql")]
fn run(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let no_discount = output::FunctionRunResult {
        discounts: vec![],
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    };

    let config = match input.discount_node.metafield {
        Some(input::InputDiscountNodeMetafield { value }) => Configuration::from_str(&value),
        None => return Ok(no_discount),
    };

    Ok(output::FunctionRunResult {
        discounts: vec![output::Discount {
            value: output::Value::Percentage(output::Percentage {
                value: Decimal(config.percentage),
            }),
            message: Some("Discount applied".to_string()),
            conditions: vec![output::Condition::OrderMinimumSubtotal(
                output::OrderMinimumSubtotal {
                    target_type: output::TargetType::ORDER_SUBTOTAL,
                    minimum_amount: Decimal(config.minimum_amount as f64),
                    excluded_variant_ids: vec![],
                },
            )]
            .into(),
            targets: vec![output::Target::OrderSubtotal(output::OrderSubtotalTarget {
                excluded_variant_ids: vec![],
            })],
        }],
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    })
}
// [END order-discount.run-configuration]
