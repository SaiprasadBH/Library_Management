export interface IMemberBase {
  name: string;
  age: number;
  phoneNumber: string;
  address: string;
}
export interface IMember extends IMemberBase {
  id: number;
}
