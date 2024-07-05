import { z } from "zod";

export const MemberBaseSchema = z.object({
  name: z
    .string({ message: "Name must be string" })
    .min(3, { message: "Name must be atleast 3 characters long." }),
  age: z
    .number({ message: "Age must be a number." })
    .int()
    .min(5, { message: "Member must be atleast 5 years old." })
    .max(100, { message: "Member cannot live that long." }),
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be atleast 10 digits long." })
    .max(12, { message: "Phone number cannot be longer than 12 digits." }),
  address: z.string().min(5, {
    message: "Address is too short, must be of minimum 5 characters long.",
  }),
});

export const MemberSchema = MemberBaseSchema.extend({
  id: z.number().int().min(1),
});

export type IMemberBase = z.input<typeof MemberBaseSchema>;
export type IMember = z.input<typeof MemberSchema>;
