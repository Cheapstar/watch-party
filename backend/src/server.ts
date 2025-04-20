import express from "express";
import rootRouter from "./routes";
import redis, { Redis } from "ioredis";

const app = express();

app.use(express.json());
app.use("api/v1/", rootRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
