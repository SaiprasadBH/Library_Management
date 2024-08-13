import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";
import { config } from "dotenv";
import { BookRepository } from "../../src/book-management/book.repository";
import {
  books,
  drizzleAdapter,
} from "../../drizzle-mysql2-orm/drizzleMysqlAdapter";
import { IPageRequest } from "../../src/core/pagination";
import { IBookBase } from "../../src/models/book.schema";
import { hashPassword, comparePassword } from "./passwordHashing";
import {
  generateAccessToken,
  generateRefreshToken,
} from "./jwtTokenGenerators";
import { IUser } from "../../src/models/member.model";
import { IDrizzleAdapter } from "../../drizzle-mysql2-orm/drizzleMysqlAdapter";
import { users } from "../../drizzle-mysql2-orm/schema";
import { eq } from "drizzle-orm";
import cookieParser from "cookie-parser";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
const accessTokenSecret =
  process.env.ACCESS_TOKEN_SECRET || "some_default_token";
const refreshTokenSecret =
  process.env.REFRESH_TOKEN_SECRET || "some_default_token";

config();

const db = drizzleAdapter.getPoolConnection();
const app = express();
app.use(express.json());
app.use(cookieParser());

// Registration Route
app.post("/register", async (req, res) => {
  try {
    const { userName, password, role } = req.body;

    const hashedPassword = await hashPassword(password);
    const newUser = {
      userName,
      password: hashedPassword,
      role,
    };

    await (await db).insert(users).values(newUser); // Insert new user into the database
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).end((err as Error).message);
  }
});

// Login Route
app.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;

    const user = await (await db)
      .select()
      .from(users)
      .where(eq(users.userName, userName));
    // Retrieve user by userName
    if (!user) return res.status(400).json({ message: "User not found" });

    const isPasswordValid = await comparePassword(password, user[0].password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user[0] as IUser);
    const refreshToken = generateRefreshToken(user[0] as IUser);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // use secure cookies in production
      sameSite: "strict",
    });
    res.json({ accessToken });
  } catch (err) {
    res.status(400).end((err as Error).message);
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

const bookRepository = new BookRepository(drizzleAdapter);
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user; // Store user info in the request object
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.sendStatus(403); // Forbidden
    }
  };
};

app.get("/books", authenticateJWT, async (req, res) => {
  try {
    const bookId = req.query.id as string;
    const offset = req.query.offset as string;
    const limit = req.query.limit as string;
    const search = req.query.search || "";

    if (bookId) {
      const book = await bookRepository.getById(Number(bookId));
      res.status(200).json(book);
    } else if (offset && limit) {
      const pageRequest: IPageRequest = {
        offset: Number(offset),
        limit: Number(limit),
        search: search as string,
      };
      const paginatedBooks = await bookRepository.list(pageRequest);
      res.status(200).json(paginatedBooks);
    } else {
      const db = await drizzleAdapter.getStandaloneConnection();
      const allBooks = await db.select().from(books);
      res.status(200).json(allBooks);
    }
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

app.post(
  "/books",
  authenticateJWT,
  authorizeRoles("admin", "librarian"),
  async (req, res) => {
    try {
      const bookData: IBookBase = req.body;
      const newBook = await bookRepository.create(bookData);
      res.status(201).json(newBook);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }
);

app.delete(
  "/books",
  authenticateJWT,
  authorizeRoles("admin", "librarian"),
  async (req, res) => {
    try {
      const bookId = Number(req.query.id as string);
      const deletedBook = await bookRepository.delete(bookId);
      res.status(200).json(deletedBook);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }
);

app.post("/token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.sendStatus(401);
  }

  try {
    const user = jwt.verify(refreshToken, refreshTokenSecret) as JwtPayload;
    const newAccessToken = generateAccessToken(user as IUser);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.sendStatus(403);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});
