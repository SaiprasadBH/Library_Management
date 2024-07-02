export interface IBookBase {
  title: string;
  author: string;
  publisher: string;
  genre: string[];
  isbNo: string;
  numOfPages: number;
  totalNumOfCopies: number;
}
export interface IBook extends IBookBase {
  id: number;
  availableNumOfCopies: number;
}
