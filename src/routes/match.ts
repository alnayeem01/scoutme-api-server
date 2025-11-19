import { Router } from "express";
import { matchRequests, requestMatchAnalysis } from "../controllers/matchController";
import { authenticate } from "../middleware/authenticate";
import { validateSchema } from "../middleware/validate";
import { matchRequestSchema } from "../validators/matchValidators";

const router = Router()

router.post('/request', authenticate, validateSchema(matchRequestSchema) ,requestMatchAnalysis)

router.get('/', authenticate , matchRequests)

export default router