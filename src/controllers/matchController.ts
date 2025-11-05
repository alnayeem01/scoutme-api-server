import { Request, RequestHandler, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { RequestMatchAnalysisBody } from "../@types";
const prisma = new PrismaClient();

export const requestMatchAnalysis: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    //find user from auht middleware
    const { uid } = req.user;

    // check if user exist
    const user = await prisma.user.findUnique({ where: { UID: uid } });
    if (!user) return res.status(400).json({ error: "user not found!" });

    const { videoUrl, players, lineUpImage } =
      req.body as RequestMatchAnalysisBody;

    const match = await prisma.matchRequest.create({
      data: {
        userId: uid,
        videoUrl,
        lineUpImage,
        players: {
          create: players,
        },
      },
      include: { players: true },
    });

    return res.status(201).json({
      message: "Match analysis request created succesfully!",
      data: match,
    });
  } catch (e: any) {
    console.error("Error saving user:", e); // <-- log the actual error
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};
