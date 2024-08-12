import express, { NextFunction, Request, Response } from "express";
import { MemberRepository } from "../../src/member-management/member.repository";
import { drizzleAdapter } from "../../drizzle-mysql2-orm/drizzleMysqlAdapter";
import { IPageRequest } from "../../src/core/pagination";

const memberRepo = new MemberRepository(drizzleAdapter);
const app = express();
const port = 3000;

// Middleware to parse JSON body
app.use(express.json());

// Middleware to set headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  next();
});

// Request specific routes

app.get("/members", async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    const search = req.query.search as string | "";
    const offset = req.query.offset as string;
    const limit = req.query.limit as string;

    if (id) {
      const member = await memberRepo.getById(Number(id));
      res.status(200).json(member);
    } else if (offset && limit) {
      const paginationObject: IPageRequest = {
        search: search || "",
        offset: Number(offset),
        limit: Number(limit),
      };
      const paginatedMembers = await memberRepo.list(paginationObject);
      res.status(200).json(paginatedMembers);
    } else {
      const allMembers = await memberRepo.list({
        offset: 0,
        limit: 100,
        search: "",
      });
      res.status(200).json(allMembers);
    }
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

app.post("/members", async (req: Request, res: Response) => {
  try {
    const memberData = req.body;
    const newMember = await memberRepo.create(memberData);
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

app.patch("/members", async (req: Request, res: Response) => {
  try {
    const memberId = Number(req.query.id as string);
    const memberData = req.body;
    const updatedMember = await memberRepo.update(memberId, memberData);
    res.status(200).json(updatedMember);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

app.delete("/members", async (req: Request, res: Response) => {
  try {
    const memberId = Number(req.query.id as string);
    const deletedMember = await memberRepo.delete(memberId);
    res.status(200).json(deletedMember);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
