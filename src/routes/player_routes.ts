import { Router } from "express";
import {
  listPlayerProfiles,
  getPlayerProfileById,
  searchPlayerProfiles,
  updatePlayerProfile,
} from "../controllers/player_profile_controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.get("/", authenticate, listPlayerProfiles); // list all player profiles
router.get("/search", authenticate, searchPlayerProfiles); // search player profiles by parameters
router.get("/:id", authenticate, getPlayerProfileById); // get a player profile by id
router.put("/:id", authenticate, updatePlayerProfile); // update a player profile

export default router;
