import test from "node:test";
import assert from "node:assert/strict";
import { buildLineItems } from "./orderLineItems.js";
import { applyRewardDiscount, pointsEligibleAmount, resolveUsablePoints } from "./rewardPoints.js";
import { isBenefitExcludedProduct } from "./benefitExclusions.js";

test("p079 and p001 are excluded and other products are not", () => {
  assert.equal(isBenefitExcludedProduct("p079"), true);
  assert.equal(isBenefitExcludedProduct(" p079 "), true);
  assert.equal(isBenefitExcludedProduct("p001"), true);
  assert.equal(isBenefitExcludedProduct(" p001 "), true);
  assert.equal(isBenefitExcludedProduct("p100"), false);
  assert.equal(isBenefitExcludedProduct(""), false);
});

test("buildLineItems flags only excluded products and keeps their price", () => {
  const { lineItems, totalAmount } = buildLineItems([
    { productId: "p079", productName: "마카다미아", optionName: "500g", qty: 2, price: 8000, resolvedShippingFee: 3000, category: "농산물" },
    { productId: "p100", productName: "사과", qty: 1, price: 12000, resolvedShippingFee: 0, category: "과일" },
  ]);
  assert.equal(totalAmount, 8000 * 2 + 3000 + 12000);
  assert.equal(lineItems[0].rewardExcluded, true);
  assert.equal(lineItems[0].totalAmount, 19000);
  assert.equal(lineItems[0].productId, "p079");
  assert.equal(lineItems[1].rewardExcluded, false);
  assert.equal(lineItems[1].totalAmount, 12000);
});

test("points cannot be redeemed on a p001-only order", () => {
  const { lineItems, totalAmount } = buildLineItems([
    { productId: "p001", productName: "소곱창모둠", qty: 1, price: 12000, resolvedShippingFee: 3000 },
  ]);
  assert.equal(lineItems[0].rewardExcluded, true);
  assert.equal(pointsEligibleAmount(lineItems), 0);
  assert.equal(resolveUsablePoints(20000, 10000, pointsEligibleAmount(lineItems)), 0);
  const priced = applyRewardDiscount(lineItems, totalAmount, 10000);
  assert.equal(priced.usedPoints, 0);
  assert.equal(priced.totalAmount, 15000);
  assert.equal(priced.lineItems[0].totalAmount, 15000);
});

test("points cannot be redeemed on a p079-only order", () => {
  const { lineItems, totalAmount } = buildLineItems([
    { productId: "p079", productName: "마카다미아", qty: 1, price: 15000, resolvedShippingFee: 3000 },
  ]);
  assert.equal(pointsEligibleAmount(lineItems), 0);
  assert.equal(resolveUsablePoints(20000, 10000, pointsEligibleAmount(lineItems)), 0);
  const priced = applyRewardDiscount(lineItems, totalAmount, 10000);
  assert.equal(priced.usedPoints, 0);
  assert.equal(priced.totalAmount, 18000);
  assert.equal(priced.lineItems[0].totalAmount, 18000);
});

test("mixed cart redeems points only against non-excluded lines", () => {
  const { lineItems, totalAmount } = buildLineItems([
    { productId: "p100", productName: "사과", qty: 1, price: 20000, resolvedShippingFee: 0 },
    { productId: "p079", productName: "마카다미아", qty: 1, price: 5000, resolvedShippingFee: 3000 },
    { productId: "p080", productName: "배", qty: 1, price: 20000, resolvedShippingFee: 0 },
  ]);
  assert.equal(pointsEligibleAmount(lineItems), 40000);
  const requested = resolveUsablePoints(20000, 15000, pointsEligibleAmount(lineItems));
  assert.equal(requested, 15000);
  const priced = applyRewardDiscount(lineItems, totalAmount, requested);
  assert.equal(priced.usedPoints, 15000);
  assert.equal(priced.totalAmount, totalAmount - 15000);
  const byId = Object.fromEntries(priced.lineItems.map((it) => [it.productId, it.totalAmount]));
  assert.equal(byId.p079, 8000);
  assert.equal(byId.p100 + byId.p080, 40000 - 15000);
});

test("points cannot be redeemed on an order under the minimum order amount", () => {
  const { lineItems } = buildLineItems([
    { productId: "p100", productName: "사과", qty: 1, price: 10000, resolvedShippingFee: 0 },
  ]);
  assert.equal(pointsEligibleAmount(lineItems), 10000);
  assert.equal(resolveUsablePoints(20000, 5000, pointsEligibleAmount(lineItems)), 0);
});

test("orders without excluded products still discount from the last line backward", () => {
  const lineItems = [
    { productId: "p100", totalAmount: 1000 },
    { productId: "p080", totalAmount: 500 },
  ];
  const priced = applyRewardDiscount(lineItems, 1500, 700);
  assert.deepEqual(
    priced.lineItems.map((it) => it.totalAmount),
    [800, 0]
  );
  assert.equal(priced.totalAmount, 800);
  assert.equal(priced.usedPoints, 700);
});
