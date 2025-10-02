import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  clientId: z.string().min(1, 'Client ID é obrigatório'),
});

export const initializeSessionSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Número de telefone inválido')
    .regex(/^\d+$/, 'Apenas números são permitidos'),
  providerType: z.number().int().min(0).max(1), // 0 = Baileys, 1 = Meta API
});

export const sendTextMessageSchema = z.object({
  to: z.string().min(10, 'Número de telefone inválido'),
  content: z.string().min(1, 'Mensagem não pode estar vazia'),
});

export const sendMediaMessageSchema = z.object({
  to: z.string().min(10, 'Número de telefone inválido'),
  mediaBase64: z.string().min(1, 'Mídia é obrigatória'),
  mediaType: z.enum(['image', 'video', 'document']),
  caption: z.string().optional(),
});

export const sendLocationMessageSchema = z.object({
  to: z.string().min(10, 'Número de telefone inválido'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const tenantSettingsSchema = z.object({
  settings: z.object({
    defaultProvider: z.enum(['baileys', 'meta_api']).optional(),
    metaApiConfig: z.object({
      phoneNumberId: z.string(),
      accessToken: z.string(),
    }).optional(),
    webhookUrl: z.string().url().optional(),
    webhookSecret: z.string().optional(),
    rateLimit: z.object({
      messagesPerMinute: z.number().min(1),
      messagesPerHour: z.number().min(1),
    }).optional(),
    notifications: z.object({
      email: z.boolean(),
      webhook: z.boolean(),
    }).optional(),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type InitializeSessionInput = z.infer<typeof initializeSessionSchema>;
export type SendTextMessageInput = z.infer<typeof sendTextMessageSchema>;
export type SendMediaMessageInput = z.infer<typeof sendMediaMessageSchema>;
export type SendLocationMessageInput = z.infer<typeof sendLocationMessageSchema>;
export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>;
