use shopify_function::prelude::*;
use shopify_function::Result;

use serde::{Deserialize, Serialize};

// [START function-configuration.create-a-structure]
#[derive(Serialize, Deserialize, PartialEq)]
#[serde(rename_all(deserialize = "camelCase"))]
struct Configuration {
    pub quantity: i64,
    pub percentage: f64,
}

impl Configuration {
    const DEFAULT_QUANTITY: i64 = 999;
    const DEFAULT_PERCENTAGE: f64 = 0.0;
    fn from_str(value: &str) -> Self {
        serde_json::from_str(value).expect("Unable to parse configuration value from metafield")
    }
}
// [END function-configuration.create-a-structure]


impl Default for Configuration {
    fn default() -> Self {
        Configuration {
            quantity: Self::DEFAULT_QUANTITY,
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

    // [START function-configuration.use-metafield]
    let config = match input.discount_node.metafield {
        Some(input::InputDiscountNodeMetafield { value }) => Configuration::from_str(&value),
        None => return Ok(no_discount),
    };
    // [END function-configuration.use-metafield]

    let targets = input
        .cart
        .lines
        .iter()
        // [START function-configuration.use-metafield]
        .filter(|line| line.quantity >= config.quantity)
        // [END function-configuration.use-metafield]
        .map(|line| output::Target::CartLine(output::CartLineTarget {
            id: line.id.to_string(),
            quantity: None,
        }))
        .collect::<Vec<output::Target>>();

    if targets.is_empty() {
        eprintln!("No cart lines qualify for volume discount.");
        return Ok(no_discount);
    }

    Ok(output::FunctionRunResult {
        discounts: vec![output::Discount {
            message: None,
            targets,
            // [START function-configuration.use-metafield]
            value: output::Value::Percentage(output::Percentage {
                value: Decimal(config.percentage),
            }),
            // [END function-configuration.use-metafield]
        }],
        discount_application_strategy: output::DiscountApplicationStrategy::FIRST,
    })
}
