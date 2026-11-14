export interface Category {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  image_url?: string | null;
}

export interface Product {
  id: number;
  sku: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  brand: string | null;
  images: string[];
  specs: {ar: Record<string, string>; en: Record<string, string>};
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  category: {id: number; slug: string; name_ar: string; name_en: string};
  created_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  user_name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone: string | null;
  created_at: string;
}

export interface CartItem {
  id: number;
  qty: number;
  line_total: number;
  product: Product;
}

export interface CartPayload {
  items: CartItem[];
  subtotal: number;
  count: number;
}

export type OrderStatus =
  | 'pending' | 'paid' | 'processing' | 'shipped'
  | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: number;
  name_ar: string;
  name_en: string;
  image: string | null;
  unit_price: number;
  qty: number;
  line_total: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_method: 'cod' | 'card';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  coupon_code: string | null;
  ship_name: string;
  ship_phone: string;
  ship_line1: string;
  ship_city: string;
  ship_country: string;
  placed_at: string;
  items: OrderItem[];
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: number;
}
