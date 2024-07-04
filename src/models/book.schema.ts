import { z } from "zod";

export const bookSchema = z.object({
  title: z.string(),
  author: z.string(),
  publisher: z.string(),
  genre: z.array(z.string()),
  isbNo: z.string(),
  numOfPages: z
    .number()
    .int()
    .positive("Number of pages must be a positive integer"),
  totalNumOfCopies: z
    .number()
    .int()
    .positive("Total number of copies must be a positive integer"),
});

export const BookSchema = bookSchema.extend({
  id: z.number().int().min(1),
});

export type IBookBase = z.input<typeof bookSchema>;
export type IBook = z.input<typeof BookSchema>;
