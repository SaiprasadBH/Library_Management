export interface IPagedResponse<T> {
  items: T[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}

export interface IPageRequest {
  search?: string;
  offset: number;
  limit: number;
}
