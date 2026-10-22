// The #218 spike on a development build: the forecast-style chart drawn by react-native-chart-kit 7.0.4 on
// react-native-svg 15.16.0 renders on the new architecture, and a tap on a point reports that month and its
// amounts. The screen's sample is fixed (`src/dev/forecast-chart.ts`), so the last of its twelve months is
// October 2027 with a balance of -2 693,95; the test devices run in English (docs/testing.md), and the amount
// assertions accept either language's separators.
import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";
import { type Fixtures, openDevScreen, settle } from "./support/showcase";

/** The chart itself: its own view, which chart-kit sizes and draws into. */
function chart({ screen }: Pick<Fixtures, "screen">) {
  return screen.getByTestId("chart-spike-chart");
}

/**
 * Taps the chart at a fraction of its own width. The point nearest to the tap is the one that gets selected, so
 * the far right of the plot is the last month and a smaller fraction is an earlier one. The vertical centre is
 * inside the plot at any month.
 */
async function tapChart(fixtures: Fixtures, widthFraction: number) {
  const box = await chart(fixtures).boundingBox();
  if (!box) throw new Error("the chart has no bounds");
  await chart(fixtures).tap({ position: { x: box.width * widthFraction, y: box.height * 0.5 } });
  await settle();
}

test("draws the projected months and waits for a tap", async (fixtures) => {
  // Arrange
  const { app } = fixtures;
  await openDevScreen(fixtures, "chart-spike", "screen-dev-chart-spike");

  // Act
  const box = await chart(fixtures).boundingBox();

  // Assert: the chart took the space it was given, and nothing is selected yet.
  expect(box?.width).toBeGreaterThan(200);
  expect(box?.height).toBeGreaterThan(200);
  await expect(fixtures.screen.getByTestId("chart-spike-hint")).toBeVisible();
  await expect(fixtures.screen.getByTestId("chart-spike-selected-month")).toHaveCount(0);
  await app.screenshot("chart-spike");
});

test("reports the month and the amounts of the tapped point", async (fixtures) => {
  // Arrange
  const { app } = fixtures;
  await openDevScreen(fixtures, "chart-spike", "screen-dev-chart-spike");
  await expect(chart(fixtures)).toBeVisible();

  // Act: the last of the twelve projected months, at the right edge of the plot.
  await tapChart(fixtures, 0.99);

  // Assert
  await expect(fixtures.screen.getByTestId("chart-spike-hint")).toHaveCount(0);
  await expect(fixtures.screen.getByTestId("chart-spike-selected-month")).toHaveText(
    "October 2027",
  );
  await expect(fixtures.screen.getByTestId("chart-spike-selected-balance")).toHaveText(
    /2[.,]?693[.,]95/,
  );
  await expect(fixtures.screen.getByTestId("chart-spike-selected-total-funds")).toHaveText(
    /3[.,]?306[.,]05/,
  );
  await app.screenshot("chart-spike-tapped");
});

test("reports another month when the chart is tapped further left", async (fixtures) => {
  // Arrange: the same screen, with the last month already selected.
  const { screen } = fixtures;
  await openDevScreen(fixtures, "chart-spike", "screen-dev-chart-spike");
  await expect(chart(fixtures)).toBeVisible();
  await tapChart(fixtures, 0.99);
  await expect(screen.getByTestId("chart-spike-selected-month")).toHaveText("October 2027");

  // Act: the middle of the same chart.
  await tapChart(fixtures, 0.5);

  // Assert: the readout moved to an earlier month, so the tap really picked a point.
  await expect(screen.getByTestId("chart-spike-selected-month")).not.toHaveText("October 2027");
});
