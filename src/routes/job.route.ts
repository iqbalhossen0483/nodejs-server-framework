import { Router } from "../core/Router.js";

const userRouter = new Router();

userRouter.get("/all", (req, res) => {
  res.json({ message: "All job list" });
});

export { userRouter };
