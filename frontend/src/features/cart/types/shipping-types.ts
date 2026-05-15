import { z } from "zod";

export const documentTypeSchema = z.enum(["DNI", "CUIT"]);

export const fiscalCategorySchema = z.enum([
  "CONSUMIDOR_FINAL",
  "RESPONSABLE_INSCRIPTO",
  "EXENTO",
  "MONOTRIBUTISTA",
]);

export const shippingFormSchema = z
  .object({
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    email: z.string().email("Email inválido").min(1, "El email es requerido"),
    phone: z
      .string()
      .min(7, "El teléfono es requerido")
      .max(15, "El teléfono debe tener entre 7 y 15 caracteres"),
    documentType: documentTypeSchema,
    documentNumber: z.string().min(1, "El número de documento es requerido"),
    fiscalCategory: fiscalCategorySchema,
    address: z.string().min(1, "La dirección es requerida"),
    city: z.string().min(1, "La ciudad es requerida"),
    province: z.string().min(1, "La provincia es requerida"),
    postalCode: z.string().min(1, "El código postal es requerido"),
    additionalInfo: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.documentType === "DNI") {
        const raw = String(data.documentNumber).replace(/\D/g, "");
        return raw.length >= 7 && raw.length <= 8;
      }
      if (data.documentType === "CUIT") {
        const raw = String(data.documentNumber).replace(/\D/g, "");
        return raw.length === 11;
      }
      return true;
    },
    {
      message: "Formato de documento inválido",
      path: ["documentNumber"],
    },
  );

export type DocumentType = z.infer<typeof documentTypeSchema>;
export type FiscalCategory = z.infer<typeof fiscalCategorySchema>;
export type ShippingFormData = z.infer<typeof shippingFormSchema>;
