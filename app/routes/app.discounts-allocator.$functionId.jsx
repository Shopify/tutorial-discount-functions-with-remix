// [START discounts-allocator.add-ui]
import { useEffect } from "react";
import { useActionData, useNavigate, useSubmit } from "react-router";
import { Banner, Card, Text, Layout, Page, BlockStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// [START discounts-allocator.action]
export const action = async ({ params, request }) => {
  const functionExtensionId = params.functionId;

  const registerDiscountsAllocatorMutation = `
    #graphql
      mutation registerDiscountsAllocator($functionExtensionId: String!) {
        discountsAllocatorFunctionRegister(functionExtensionId: $functionExtensionId) {
          userErrors {
            code
            message
            field
          }
        }
      }
    `;

  if (functionExtensionId !== null) {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(registerDiscountsAllocatorMutation, {
      variables: {
        functionExtensionId: functionExtensionId,
      },
    });

    const responseJson = await response.json();
    const errors =
      responseJson.data.discountsAllocatorFunctionRegister?.userErrors;
    return { errors };
  }

  return { errors: ["No functionExtensionId provided"] };
};
// [END discounts-allocator.action]

export default function DiscountsAllocator() {
  const actionData = useActionData();
  // [START discounts-allocator.ui-configuration]
  const submitForm = useSubmit();
  // [END discounts-allocator.ui-configuration]
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData?.errors && actionData?.errors.length === 0) {
      shopify.toast.show(
        "Discounts Allocator Function registered successfully!",
      );
    }
  }, [actionData]);

  const errorBanner = actionData?.errors.length ? (
    <Layout.Section>
      <Banner
        title="There were some issues with your form submission"
        tone="critical"
      >
        <ul>
          {actionData?.errors?.map((error, index) => {
            return <li key={`${index}`}>{error.message}</li>;
          })}
        </ul>
      </Banner>
    </Layout.Section>
  ) : null;

  // [START discounts-allocator.ui-configuration]
  const actions = {
    backAction: {
      content: "Home",
      onAction: () => navigate("/app"),
    },
    primaryAction: {
      content: "Register Discounts allocator",
      onAction: () => submitForm({}, { method: "post" }),
    },
  };
  // [END discounts-allocator.ui-configuration]

  return (
    // [START discounts-allocator.ui-configuration]
    <Page title="Register Discounts Allocator Function" {...actions}>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="bodyMd">
                Add more awesome details about your allocator here! (Like
                ability to add metafields)
              </Text>
            </Card>
          </Layout.Section>
          {errorBanner}
        </Layout>
      </BlockStack>
    </Page>
    // [END discounts-allocator.ui-configuration]
  );
}
// [END discounts-allocator.add-ui]
