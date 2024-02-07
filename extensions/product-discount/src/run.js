// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

// Use JSDoc annotations for type safety
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

// The configured entrypoint for the 'purchase.product-discount.run' extension target
/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  console.error("Inside the run function")
  
  //Define the type for your configuration, and parse it form the metafield
  /**
   * @type{{
   * quantity: number,
   * percentage: number
   * }}
   */
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
    );

    if(!configuration.quantity || !configuration.percentage){
      console.error("No configuration found");
      return EMPTY_DISCOUNT;
    }

  const targets = input.cart.lines
    // Only include cart lines with a quantity of two or more
    // and a targetable product variant
    .filter(
      (line) =>
        line.quantity >= configuration.quantity && line.merchandise.__typename == "ProductVariant",
    )
    .map((line) => {
      console.error("Inside the map function")

      const variant = /** @type {ProductVariant} */ (line.merchandise);
      return /** @type {Target} */ ({
        // Use the variant ID to create a discount target
        productVariant: {
          id: variant.id,
        },
      });
    });
    console.error("Targets: ", JSON.stringify(targets))

  if (!targets.length) {
    // You can use STDERR for debug logs in your function
    console.error("No cart lines qualify for volume discount.");
    return EMPTY_DISCOUNT;
  }

  // The @shopify/shopify_function package applies JSON.stringify() to your function result
  // and writes it to STDOUT
  console.error("Discounts will be applied ");
  return {
    discounts: [
      {
        // Apply the discount to the collected targets
        targets,
        // Define a percentage-based discount
        value: {
          percentage: {
            value: configuration.percentage.toString(),
          },
        },
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}
