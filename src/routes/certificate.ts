import { Router } from "express";
import { generateCertificate } from "../controllers/certificate.controller";
import protectRoute from "../middleware/auth";

const router = Router();

router.post("/create", protectRoute(), generateCertificate);




export default router;
