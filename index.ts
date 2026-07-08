import "dotenv/config";
import express, { Request, Response } from "express"; // Request, Response を追加
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["query"] });

const app = express();
const PORT = process.env.PORT || 8888;

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.urlencoded({ extended: true }));

// 引数の req と res に型を付けるのじゃ
app.get("/", async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.render("index", { users });
});

app.post("/users", async (req: Request, res: Response) => {
  try {
    const name = req.body.name;
    const ageStr = req.body.age;

    // 入力が空なら null、文字が入っていれば数値に変換するのじゃ
    let age: number | null = null;
    if (ageStr && ageStr.trim() !== "") {
      age = Number(ageStr);
    }

    // もし数値への変換に失敗（NaN）したら、エラーとして返すぞ
    if (age !== null && isNaN(age)) {
      res.status(400).send("年齢には正しい数値を入力してくだされ。");
      return;
    }

    if (name) {
      // データベースに保存！
      const newUser = await prisma.user.create({ data: { name, age } });
      console.log("追加成功:", newUser);
    }
    res.redirect("/");
  } catch (error) {
    // もしエラーが起きたらログに出すのじゃ
    console.error("保存エラー:", error);
    res.status(500).send("データベースへの保存に失敗したようじゃ...");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
