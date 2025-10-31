import { RequestHandler } from "express";
import { PrismaClient } from "../generated/prisma/client";
const prisma = new PrismaClient();

export const registerUser: RequestHandler = async (req, res) => {
  try {
    console.log('saving user Data', req.body)
    const { name, email, phone, photoUrl, firebaseUID } = req.body;
    if (!name) return res.json({ error: "name is Missing!" });
    if (!email) return res.json({ error: "email is Missing!" });
    // if (!photoUrl) return res.json({ error: "photoUrl is Missing!" });

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        photoUrl,
        firebaseUID
      },
    });

    res
      .status(200)
      .json({ message: "User registered successfully!", data: { newUser } });

  } catch (e: any) {
    console.error("Error saving user:", e);  // <-- log the actual error
    res.status(500).json({ error: e.message || "Something went wrong" });
  }
};

