import { IBook } from "../models/book.model";
import { IMember } from "../models/member.schema";

export interface LibraryDataset {
  books: IBook[];
  members: IMember[];
}
