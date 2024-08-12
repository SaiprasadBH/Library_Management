export interface IMemberBase {
  name: string;
  age: number;
  phoneNumber: string;
  address: string;
}
export interface IMember extends IMemberBase {
  id: number;
}

export interface IUser {
  id: number;
  userName: string;
  password: string; // hashed password
  role: "admin" | "librarian" | "user";
}
