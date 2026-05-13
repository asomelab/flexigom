import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { CreditCard, Banknote, Smartphone } from "lucide-react";
import { useState } from "react";
import type { PaymentFormData, PaymentMethodType } from "../types";

interface PaymentFormProps {
  initialData?: Partial<PaymentFormData>;
  onSubmit: (data: PaymentFormData) => void;
  onBack?: () => void;
}

const paymentMethods = [
  {
    id: "mercadopago" as PaymentMethodType,
    name: "Mercado Pago",
    description: "Paga con tarjeta de crédito o débito",
    icon: Smartphone,
  },
  {
    id: "transfer" as PaymentMethodType,
    name: "Transferencia Bancaria",
    description: "Transferencia o depósito bancario",
    icon: Banknote,
  },
  {
    id: "cash" as PaymentMethodType,
    name: "Efectivo",
    description: "Pago en efectivo al recibir",
    icon: CreditCard,
  },
];

export function PaymentForm({
  initialData,
  onSubmit,
  onBack,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    initialData?.paymentMethod || "mercadopago",
  );
  const [errors, setErrors] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod) {
      setErrors("Por favor selecciona un método de pago");
      return;
    }

    const formData: PaymentFormData = {
      paymentMethod,
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>
            Método de pago <span className="text-destructive">*</span>
          </Label>

          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => {
              setPaymentMethod(value as PaymentMethodType);
              setErrors("");
            }}
            className="gap-3 grid"
          >
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <Label
                  key={method.id}
                  htmlFor={method.id}
                  className="block cursor-pointer"
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-red-600 bg-red-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-red-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        className={isSelected ? "border-red-600" : ""}
                      />
                      <div className="flex flex-1 items-center gap-3">
                        <div
                          className={`flex justify-center items-center rounded-full w-10 h-10 transition-colors ${
                            isSelected ? "bg-red-100" : "bg-gray-100"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isSelected ? "text-red-600" : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-medium text-sm ${
                              isSelected ? "text-red-700" : "text-gray-900"
                            }`}
                          >
                            {method.name}
                          </p>
                          <p
                            className={`text-xs ${
                              isSelected
                                ? "text-red-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Label>
              );
            })}
          </RadioGroup>

          {errors && <p className="text-destructive text-sm">{errors}</p>}
        </div>

        {/* Payment Method Details */}
        <Card className="bg-blue-50 p-4 border-blue-200">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">
              {paymentMethod === "mercadopago" && "Mercado Pago"}
              {paymentMethod === "transfer" && "Transferencia Bancaria"}
              {paymentMethod === "cash" && "Pago en Efectivo"}
            </h4>
            <p className="text-muted-foreground text-xs">
              {paymentMethod === "mercadopago" &&
                "Serás redirigido a Mercado Pago para completar el pago de forma segura."}
              {paymentMethod === "transfer" &&
                "Recibirás los datos bancarios por email para realizar la transferencia."}
              {paymentMethod === "cash" &&
                "Podrás pagar en efectivo al momento de recibir tu pedido."}
            </p>
          </div>
        </Card>

        {/* Security Note */}
        <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-md text-muted-foreground text-xs">
          <svg
            className="flex-shrink-0 mt-0.5 w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p>
            Tus datos están seguros. Utilizamos conexiones cifradas para
            proteger tu información.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            Volver
          </Button>
        )}
        <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
          Revisar Pedido
        </Button>
      </div>
    </form>
  );
}
