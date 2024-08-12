import express from "express";
import { hashPassword, comparePassword } from "./passwordHashing";
import {
  generateAccessToken,
  generateRefreshToken,
} from "./jwtTokenGenerators";
import { IUser } from "../../src/models/member.model";
import {
  drizzleAdapter,
  IDrizzleAdapter,
} from "../../drizzle-mysql2-orm/drizzleMysqlAdapter";
import { users } from "../../drizzle-mysql2-orm/schema";
import { eq } from "drizzle-orm";

const db = drizzleAdapter.getPoolConnection();
const app = express();
app.use(express.json());

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

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(400).end((err as Error).message);
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
