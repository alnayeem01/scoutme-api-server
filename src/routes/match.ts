import { Router } from "express";
import {
  allmatchRequestsOfUser,
  getSpecificMatchAnalysis,
  requestMatchAnalysis,
  updateMatchStatus,
} from "../controllers/matchController";
import { authenticate } from "../middleware/authenticate";
import { validateSchema } from "../middleware/validate";
import { matchRequestSchema } from "../validators/matchValidators";

const router = Router();

router.post(
  "/request",
  authenticate,
  validateSchema(matchRequestSchema),
  requestMatchAnalysis
);

router.get("/", authenticate, allmatchRequestsOfUser);
router.get("/:matchId", authenticate, getSpecificMatchAnalysis);
router.put("/:matchId", updateMatchStatus);

export default router;
