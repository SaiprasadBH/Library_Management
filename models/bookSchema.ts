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

export type IBookBase = z.infer<typeof bookSchema>;
