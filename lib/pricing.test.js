import test from "node:test";
import assert from "node:assert/strict";
import { getDiscount, getDisplayStartOption } from "./pricing.js";

test("getDiscount returns null when there is no real discount", () => {
  assert.equal(getDiscount(0, 1000), null);
  assert.equal(getDiscount(1000, 1000), null);
  assert.equal(getDiscount(1000, 1200), null);
});

test("getDiscount computes the rate when list price is higher", () => {
  assert.deepEqual(getDiscount(10000, 8000), { listPrice: 10000, rate: 20 });
});

test("getDisplayStartOption excludes 찌개 options from the start price (p133 case)", () => {
  const options = [
    { name: "구이용 생삼겹살 300g", price: 7900, listPrice: 0 },
    { name: "구이용 벌집 생삼겹살 300g", price: 8200, listPrice: 0 },
    { name: "구이용 생오겹살 300g", price: 7900, listPrice: 0 },
    { name: "구이용 벌집 생오겹살 300g", price: 8200, listPrice: 0 },
    { name: "구이용 목살 300g", price: 7500, listPrice: 0 },
    { name: "구이용 앞다리살 300g", price: 5000, listPrice: 0 },
    { name: "돈마호크 250g", price: 9900, listPrice: 0 },
    { name: "찌개용 300g", price: 4300, listPrice: 0 },
  ];
  const start = getDisplayStartOption(options);
  assert.equal(start.price, 5000);
  assert.equal(start.name, "구이용 앞다리살 300g");
});

test("getDisplayStartOption falls back to the true minimum when every option is 찌개", () => {
  const options = [
    { name: "찌개용 A", price: 3000, listPrice: 0 },
    { name: "찌개용 B", price: 2000, listPrice: 0 },
  ];
  const start = getDisplayStartOption(options);
  assert.equal(start.price, 2000);
});

test("getDisplayStartOption behaves like a plain minimum when there is no 찌개 option", () => {
  const options = [
    { name: "1kg", price: 10000, listPrice: 12000 },
    { name: "2kg", price: 18000, listPrice: 0 },
  ];
  const start = getDisplayStartOption(options);
  assert.equal(start.price, 10000);
  assert.equal(start.listPrice, 12000);
});

test("getDisplayStartOption returns null for an empty option list", () => {
  assert.equal(getDisplayStartOption([]), null);
  assert.equal(getDisplayStartOption(undefined), null);
});
