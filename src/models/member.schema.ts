import { z } from "zod";

export const MemberBaseSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
  phoneNumber: z.string().min(10).max(15),
  address: z.string().min(1),
});

export const MemberSchema = MemberBaseSchema.extend({
  id: z.number().int().min(1),
});

export type IMemberBase = z.input<typeof MemberBaseSchema>;
export type IMember = z.input<typeof MemberSchema>;
