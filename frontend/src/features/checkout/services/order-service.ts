import api from "@/lib/api";

export interface ManualOrderItem {
  productId: string;
  quantity: number;
  composition?: string;
  measurement?: string;
  base_type?: "Económica" | "Reforzada";
}

export interface ManualOrderPayer {
  name?: string;
  surname?: string;
  email?: string;
  phone?: { area_code?: string; number?: string };
  identification?: { type?: string; number?: string };
  fiscalCategory?: string;
  address?: string;
}

export interface ManualOrderRequest {
  items: ManualOrderItem[];
  payer?: ManualOrderPayer;
  couponCode?: string;
  payment_method: string;
  external_reference: string;
}

export interface ManualOrderResponse {
  external_reference: string;
  total: number;
  currency: string;
  order_id: number;
}

export async function createManualOrder(
  data: ManualOrderRequest,
): Promise<ManualOrderResponse> {
  const response = await api.post<{ data: ManualOrderResponse }>(
    "/orders/manual",
    data,
  );
  return response.data.data;
}
