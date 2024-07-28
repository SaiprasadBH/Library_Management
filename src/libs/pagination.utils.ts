import { IPagedResponse, IPageRequest } from "../core/pagination";
import { IRepository } from "../core/repository";
import { BaseModels, Models } from "../core/types";
import { clearScreen, readChar, readLine } from "./input.utils";
import {
  printResult,
  printPanel,
  printHint,
  printButton,
  printError,
} from "./output.utils";

type updatedPage = Awaited<ReturnType<typeof updatePage>>;

export const displayPage = (items: Models | Models[]) => {
  console.table(items);
};

async function updatePage<
  Repository extends Pick<IRepository<BaseModels, Models>, "list">,
>(
  key: string,
  repo: Repository,
  page: IPagedResponse<Models>,
  searchText: string | undefined
) {
  const total = page.pagination.total;
  let offset = page.pagination.offset;
  let limit = page.pagination.limit;

  if (key === "\u001b[C") {
    if (offset + limit < total) {
      offset = offset + limit;
    }
  } else if (key === "\u001b[D") {
    if (offset - limit >= 0) {
      offset = offset - limit;
    }
  }
  const updatedPageIndex = Math.floor(offset / limit) + 1;
  const updatedPage = (await repo.list({
    search: searchText,
    offset,
    limit,
  }))!;
  return { updatedPage, updatedPageIndex };
}

export const loadPage = async <
  Repository extends Pick<IRepository<BaseModels, Models>, "list">,
>(
  repo: Repository,
  pageRequest: IPageRequest
) => {
  try {
    let loadedPage = await repo.list(pageRequest);
    let pageIndex = 1;
    if (loadedPage) {
      const totalPages = Math.ceil(
        loadedPage.pagination.total / pageRequest.limit
      );
      while (true) {
        clearScreen();
        printResult(
          pageRequest.search
            ? `Search result for "${pageRequest.search}"`
            : "All current Members of the Library"
        );
        displayPage(loadedPage!.items);

        const navPanel = `${pageIndex === 1 ? "" : "<"} ${pageIndex}/${totalPages} ${pageIndex === totalPages ? "" : ">"}`;
        printPanel(`${navPanel}`);

        printHint(`Press ${printButton} to continue`);
        const key = await readChar();
        if (key === "\u001b[C" || key === "\u001b[D") {
          if (pageIndex === 1 && key === "\u001b[D") continue;
          else if (pageIndex === totalPages && key === "\u001b[C") continue;
          else {
            const { updatedPage, updatedPageIndex }: updatedPage =
              await updatePage(key, repo, loadedPage!, pageRequest.search);
            loadedPage = updatedPage;
            pageIndex = updatedPageIndex;
          }
        } else if (key === "\r") break;
      }
    }
  } catch (err) {
    if (err instanceof Error) printError(err.message);
    printHint(`Press ${printButton} to continue`);
    await readLine("");
  }
};
