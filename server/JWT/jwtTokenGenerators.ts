import jwt from "jsonwebtoken";
import { IUser } from "../../src/models/member.model";
import "dotenv/config";
import { config } from "dotenv";
config();

const accessTokenSecret =
  process.env.ACCESS_TOKEN_SECRET || "some_default_token";
const refreshTokenSecret =
  process.env.REFRESH_TOKEN_SECRET || "some_default_token";

export const generateAccessToken = (user: IUser) => {
  return jwt.sign({ id: user.id, role: user.role }, accessTokenSecret, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (user: IUser) => {
  return jwt.sign({ id: user.id }, refreshTokenSecret, { expiresIn: "7d" });
};
