import { z } from "zod";

export const bookSchema = z.object({
  title: z
    .string({ message: "Book title must be a string." })
    .min(3, { message: "Title must be a minimum 3 characters long." }),
  author: z
    .string({ message: "Author name must be a string." })
    .min(5, { message: "Author name must be minimum 5 characters long." }),
  publisher: z
    .string({ message: "Publisher name must be a string." })
    .min(5, { message: "Publisher name must be minimum 5 characters long." }),
  genre: z.array(z.string({ message: "Genre must be a string." })),
  isbnNo: z
    .string()
    .min(13, { message: "ISBN number must be minimum 13 characters long." })
    .max(13, { message: "ISBN number must be maximum 13 characters long." }),
  numOfPages: z
    .number({ message: "Number of pages must be a number." })
    .int({ message: "Number of pages cannot be a decimal number." })
    .positive("Number of pages must be a positive integer"),
  totalNumOfCopies: z
    .number({ message: "Number of copies must be a number." })
    .int({ message: "Number of copies cannot be a decimal number." })
    .positive("Total number of copies must be a positive integer"),
});

export const BookSchema = bookSchema.extend({
  id: z.number().int().min(1),
});

export type IBookBase = z.input<typeof bookSchema>;
export type IBook = z.input<typeof BookSchema>;
