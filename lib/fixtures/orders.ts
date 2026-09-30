import type { Order } from "@/lib/types";

/** Sample history shown until customer accounts are wired to WooCommerce. */
export const sampleOrders: Order[] = [
  {
    id: "IQ-10421",
    email: "guest@example.com",
    createdAt: "2026-08-02T15:04:00.000Z",
    status: "fulfilled",
    currency: "USD",
    subtotal: 164,
    shipping: 0,
    total: 164,
    items: [
      {
        name: "Structured Tote",
        quantity: 1,
        unitPrice: 164,
        attributes: {},
      },
    ],
    shippingAddress: {
      firstName: "Avery",
      lastName: "Cole",
      line1: "18 Mercer Street",
      city: "New York",
      region: "NY",
      postalCode: "10013",
      country: "US",
    },
  },
  {
    id: "IQ-10388",
    email: "guest@example.com",
    createdAt: "2026-06-19T11:20:00.000Z",
    status: "fulfilled",
    currency: "USD",
    subtotal: 126,
    shipping: 8,
    total: 134,
    items: [
      {
        name: "Ceramic Pour-Over",
        quantity: 1,
        unitPrice: 54,
        attributes: {},
      },
      {
        name: "Merino Crew",
        quantity: 1,
        unitPrice: 72,
        attributes: {},
      },
    ],
    shippingAddress: {
      firstName: "Avery",
      lastName: "Cole",
      line1: "18 Mercer Street",
      city: "New York",
      region: "NY",
      postalCode: "10013",
      country: "US",
    },
  },
  {
    id: "IQ-10302",
    email: "guest@example.com",
    createdAt: "2026-03-11T09:00:00.000Z",
    status: "cancelled",
    currency: "USD",
    subtotal: 240,
    shipping: 0,
    total: 240,
    items: [
      {
        name: "Arc Studio Lamp",
        quantity: 1,
        unitPrice: 240,
        attributes: {},
      },
    ],
    shippingAddress: {
      firstName: "Avery",
      lastName: "Cole",
      line1: "18 Mercer Street",
      city: "New York",
      region: "NY",
      postalCode: "10013",
      country: "US",
    },
  },
];
