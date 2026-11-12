import test from "node:test";
import assert from "node:assert/strict";
import {
  calcShippingTotal,
  resolveShippingFees,
  COMBINED_SHIPPING_CATEGORY,
  COMBINED_SHIPPING_FEE_LIGHT,
  COMBINED_SHIPPING_FEE_HEAVY,
} from "./shipping.js";

function handon(productId, extra = {}) {
  return {
    productId,
    category: "정육",
    qty: 1,
    shippingFee: 4500,
    weightG: 0,
    combinedShippingQty: 0,
    ...extra,
  };
}

test("p132 and p133 share one 4500 shipping fee", () => {
  const total = calcShippingTotal([
    handon("p132", { optionName: "500g", qty: 2 }),
    handon("p133", { optionName: "1kg", qty: 3 }),
  ]);
  assert.equal(total, 4500);
});

test("multiple options of only p132 are 4500 once when combined_shipping_qty is empty", () => {
  const items = [
    handon("p132", { optionName: "A", qty: 2 }),
    handon("p132", { optionName: "B", qty: 4 }),
  ];
  const resolved = resolveShippingFees(items);
  assert.equal(resolved[0].resolvedShippingFee, 4500);
  assert.equal(resolved[1].resolvedShippingFee, 0);
  assert.equal(calcShippingTotal(items), 4500);
});

test("multiple options of only p133 are 4500 once", () => {
  assert.equal(
    calcShippingTotal([
      handon("p133", { optionName: "A", qty: 1 }),
      handon("p133", { optionName: "B", qty: 2 }),
    ]),
    4500
  );
});

test("p132 with a high qty still charges 4500 once", () => {
  assert.equal(
    calcShippingTotal([
      handon("p132", { qty: 5, combinedShippingQty: 1 }),
      handon("p133", { qty: 4, combinedShippingQty: 1 }),
    ]),
    4500
  );
});

test("p132 plus a jeotgal item pays the handon fee and the combined jeotgal fee", () => {
  assert.equal(
    calcShippingTotal([
      handon("p132", { qty: 2 }),
      { productId: "p037", category: COMBINED_SHIPPING_CATEGORY, qty: 1, shippingFee: 3000, weightG: 1000 },
    ]),
    4500 + COMBINED_SHIPPING_FEE_LIGHT
  );
});

test("jeotgal over 5kg still uses the heavy combined fee once", () => {
  assert.equal(
    calcShippingTotal([
      { productId: "p037", category: COMBINED_SHIPPING_CATEGORY, qty: 2, shippingFee: 3000, weightG: 3000 },
      { productId: "p028", category: COMBINED_SHIPPING_CATEGORY, qty: 1, shippingFee: 3000, weightG: 1000 },
    ]),
    COMBINED_SHIPPING_FEE_HEAVY
  );
});

test("p101 still charges shipping once across options", () => {
  assert.equal(
    calcShippingTotal([
      { productId: "p101", category: "기타", qty: 2, shippingFee: 3500 },
      { productId: "p101", category: "기타", qty: 1, shippingFee: 3500 },
    ]),
    3500
  );
});

test("p105 box fee is unchanged when another product is in the cart", () => {
  assert.equal(
    calcShippingTotal([
      { productId: "p105", category: "기타", qty: 1, shippingFee: 3000 },
      { productId: "p105", category: "기타", qty: 1, shippingFee: 3000 },
      { productId: "p100", category: "과일", qty: 1, shippingFee: 4000 },
    ]),
    5000 + 3000 + 4000
  );
});

test("p105 alone does not add the box fee", () => {
  assert.equal(
    calcShippingTotal([{ productId: "p105", category: "기타", qty: 1, shippingFee: 3000 }]),
    3000
  );
});

test("combined_shipping_qty still counts boxes for other products", () => {
  assert.equal(
    calcShippingTotal([
      { productId: "p099", category: "기타", qty: 3, shippingFee: 3000, combinedShippingQty: 2 },
      { productId: "p099", category: "기타", qty: 2, shippingFee: 3000, combinedShippingQty: 2 },
    ]),
    9000
  );
});

test("other product ids are not included in the p132/p133 group", () => {
  assert.equal(
    calcShippingTotal([
      handon("p132"),
      { productId: "p128", category: "기타", qty: 1, shippingFee: 4500 },
      { productId: "p134", category: "기타", qty: 2, shippingFee: 3000 },
    ]),
    4500 + 4500 + 3000
  );
});
