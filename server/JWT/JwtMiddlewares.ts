import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";
import { config } from "dotenv";
config();

declare global {
  namespace Express {
    interface Request {
      user?: any; // Adjust the type according to your JWT payload
    }
  }
}

const app = express();
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET || "some_default_token";
  const refreshTokenSecret =
    process.env.REFRESH_TOKEN_SECRET || "some_default_token";
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

app.get("/books", authenticateJWT, (req, res) => {
  // Only logged-in users can see the books
  //select all books and send it to response
});

app.post(
  "/books",
  authenticateJWT,
  authorizeRoles("admin", "librarian"),
  (req, res) => {
    // Only admin or librarian can add books
    const newBook = req.body;
    //adding new book
    res.status(201).json(newBook);
  }
);

app.delete(
  "/books/:id",
  authenticateJWT,
  authorizeRoles("admin", "librarian"),
  (req, res) => {
    // Only admin or librarian can delete books
    const bookId = parseInt(req.params.id, 10);
    //getBookById
    //delete book

    //else send error status
  }
);
