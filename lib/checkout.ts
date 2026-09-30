import { shippingAmount } from "@/lib/money";
import type { Product, ShippingAddress } from "@/lib/types";

export type CheckoutItemInput = {
  productId: number;
  variationId?: string;
  quantity: number;
};

export type CheckoutInput = {
  email: string;
  phone?: string;
  shipping: ShippingAddress;
  items: CheckoutItemInput[];
  paymentMethod: "card";
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCheckout(
  input: unknown,
): { ok: true; value: CheckoutInput } | { ok: false; fields: Record<string, string> } {
  const body = asRecord(input);
  const fields: Record<string, string> = {};
  if (!body) {
    return { ok: false, fields: { form: "Enter your details to continue." } };
  }

  const email = text(body.email);
  if (!EMAIL.test(email)) fields.email = "Enter a valid email.";

  const phone = text(body.phone);
  const shippingRaw = asRecord(body.shipping) ?? {};
  const shipping: ShippingAddress = {
    firstName: text(shippingRaw.firstName),
    lastName: text(shippingRaw.lastName),
    line1: text(shippingRaw.line1),
    line2: text(shippingRaw.line2) || undefined,
    city: text(shippingRaw.city),
    region: text(shippingRaw.region),
    postalCode: text(shippingRaw.postalCode),
    country: text(shippingRaw.country),
  };

  if (!shipping.firstName) fields.firstName = "Enter a first name.";
  if (!shipping.lastName) fields.lastName = "Enter a last name.";
  if (!shipping.line1) fields.line1 = "Enter an address.";
  if (!shipping.city) fields.city = "Enter a city.";
  if (!shipping.region) fields.region = "Enter a region.";
  if (!shipping.postalCode) fields.postalCode = "Enter a postal code.";
  if (!["US", "CA", "GB"].includes(shipping.country)) fields.country = "Choose a country.";

  if (body.paymentMethod !== "card") fields.paymentMethod = "Choose a payment method.";

  const itemsRaw = Array.isArray(body.items) ? body.items : [];
  const items: CheckoutItemInput[] = [];
  for (const entry of itemsRaw) {
    const item = asRecord(entry);
    if (!item) continue;
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    const variationId = text(item.variationId) || undefined;
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
      fields.items = "Your cart has an invalid line.";
      break;
    }
    items.push({ productId, quantity, variationId });
  }
  if (items.length === 0) fields.items = "Your cart is empty.";

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return {
    ok: true,
    value: { email, phone: phone || undefined, shipping, items, paymentMethod: "card" },
  };
}

export function priceCheckout(products: Product[], items: CheckoutItemInput[]) {
  const lines = [];
  for (const item of items) {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) {
      return { ok: false as const, error: "A product in your cart is no longer available." };
    }

    let unitPrice = Number(product.price);
    let attributes: Record<string, string> = {};
    let stockStatus = product.stockStatus;
    let stockQuantity = product.stockQuantity;

    if (product.variations.length > 0) {
      const variation = product.variations.find((entry) => entry.id === item.variationId);
      if (!variation) {
        return { ok: false as const, error: `Choose options for ${product.name}.` };
      }
      unitPrice = Number(variation.price);
      attributes = variation.attributes;
      stockStatus = variation.stockStatus;
      stockQuantity = variation.stockQuantity;
    }

    if (stockStatus === "outofstock") {
      return { ok: false as const, error: `${product.name} is out of stock.` };
    }
    if (stockQuantity != null && item.quantity > stockQuantity) {
      return { ok: false as const, error: `Only ${stockQuantity} of ${product.name} are available.` };
    }

    lines.push({
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      attributes,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const shipping = shippingAmount(subtotal);
  return {
    ok: true as const,
    lines,
    subtotal,
    shipping,
    total: subtotal + shipping,
    currency: "USD",
  };
}

export function luhnValid(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alternate = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}
