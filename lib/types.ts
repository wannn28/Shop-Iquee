export type StockStatus = "instock" | "outofstock" | "onbackorder";

export type ProductImage = {
  src: string;
  alt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type ProductAttribute = {
  name: string;
  options: string[];
};

export type Variation = {
  id: string;
  attributes: Record<string, string>;
  price: string;
  regularPrice: string;
  salePrice: string | null;
  stockStatus: StockStatus;
  stockQuantity: number | null;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  regularPrice: string;
  salePrice: string | null;
  onSale: boolean;
  currency: string;
  images: ProductImage[];
  categories: Pick<Category, "id" | "name" | "slug">[];
  stockStatus: StockStatus;
  stockQuantity: number | null;
  attributes: ProductAttribute[];
  variations: Variation[];
  specs: { label: string; value: string }[];
  featured: boolean;
  sku: string;
  createdAt: string;
};

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc";

export type ProductQuery = {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  stock?: "instock";
  sort?: ProductSort;
};

export type CartLine = {
  lineId: string;
  productId: number;
  variationId?: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  attributes: Record<string, string>;
  stockQuantity: number | null;
};

export type ShippingAddress = {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type OrderLine = {
  name: string;
  quantity: number;
  unitPrice: number;
  attributes: Record<string, string>;
};

export type OrderStatus = "confirmed" | "pending" | "fulfilled" | "cancelled";

export type Order = {
  id: string;
  email: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingAddress: ShippingAddress;
};
