import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "../types";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { useCartStore } from "../store/cart-store";
import { Link } from "react-router";

interface CartItemProps {
  item: CartItem;
}

export function CartItemComponent({ item }: CartItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const isSyncing = useCartStore((state) => state.isSyncing);

  const { product, quantity } = item;
  const price = Number(item.price) || 0;

  const itemTotal = price * quantity;
  const imageUrl =
    product.images && product.images.length > 0
      ? getImageUrl(product.images[0].url)
      : "/flexigom.png";

  const handleIncrement = () => {
    if (quantity < product.stock) {
      updateQuantity(item.documentId!, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(item.documentId!, quantity - 1);
    } else {
      removeItem(item.documentId!);
    }
  };

  const handleRemove = () => {
    removeItem(item.documentId!);
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Product Image */}
      <Link to={`/productos/${product.slug}`} className="flex-shrink-0">
        <div className="bg-gray-100 rounded-md w-20 h-20 overflow-hidden">
          <img
            src={imageUrl || "/flexigom.png"}
            alt={product.images?.[0]?.alternativeText || product.name}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex flex-col flex-1 gap-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Link
              to={`/productos/${product.slug}`}
              className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
            >
              {product.name}
            </Link>
            {product.measurement && (
              <p className="text-muted-foreground text-xs capitalize">
                {product.measurement}
              </p>
            )}
            {item.base_type && (
              <p className="text-muted-foreground text-xs font-semibold">
                Base: {item.base_type}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 w-8 h-8 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            disabled={isSyncing}
            aria-label="Eliminar producto"
          >
            {isSyncing ? (
              <Trash2 className="w-4 h-4 animate-pulse opacity-50" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Price and Quantity */}
        <div className="flex justify-between items-center">
          {/* Quantity Controls */}
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handleDecrement}
              disabled={quantity <= 1 || isSyncing}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="px-3 min-w-[2rem] font-medium text-center text-sm">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handleIncrement}
              disabled={quantity >= product.stock || isSyncing}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Item Total */}
          <div className="text-right">
            <p className="font-semibold text-sm">{formatPrice(itemTotal)}</p>
            {product.discount_price > 0 &&
              product.discount_price < product.price && (
                <p className="text-muted-foreground text-xs line-through">
                  {formatPrice(product.price * quantity)}
                </p>
              )}
          </div>
        </div>

        {/* Stock Warning */}
        {quantity >= product.stock && (
          <p className="text-orange-600 text-xs">
            Stock máximo: {product.stock} unidades
          </p>
        )}
      </div>
    </div>
  );
}
