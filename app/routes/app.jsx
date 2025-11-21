import { Outlet, useLoaderData, useRouteError } from "react-router";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";

// [START build-the-ui.render-the-provider]\
import { AppProvider as DiscountProvider } from "@shopify/discount-app-components";
// [END build-the-ui.render-the-provider]

import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export async function loader({ request }) {
  await authenticate.admin(request);

  return {
    apiKey: process.env.SHOPIFY_API_KEY,
  };
}

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      {/* [START build-the-ui.render-the-provider] */}
      <PolarisAppProvider>
        <DiscountProvider locale="en-US" ianaTimezone="America/Toronto">
          <s-app-nav>
            <s-link href="/app">Home</s-link>
            <s-link href="/app/additional">Additional page</s-link>
          </s-app-nav>
          <Outlet />
        </DiscountProvider>
      </PolarisAppProvider>
      {/* [END build-the-ui.render-the-provider] */}
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
