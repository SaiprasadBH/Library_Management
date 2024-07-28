import { IPageRequest, IPagedResponse } from "./pagination";

export interface IRepository<
  MutationModel,
  CompleteModel extends MutationModel,
> {
  create(data: MutationModel): Promise<CompleteModel | undefined>;
  update(id: number, data: MutationModel): Promise<CompleteModel | undefined>;
  delete(id: number): Promise<CompleteModel | undefined>;
  getById(id: number): Promise<CompleteModel | undefined>;
  list(
    params: IPageRequest
  ): Promise<IPagedResponse<CompleteModel> | undefined>;
}
