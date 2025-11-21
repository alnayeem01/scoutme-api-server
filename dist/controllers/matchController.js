"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMatchStatus = exports.getSpecificMatchAnalysis = exports.allmatchRequestsOfUser = exports.requestMatchAnalysis = void 0;
const db_1 = require("../utils/db");
const requestMatchAnalysis = async (req, res) => {
    try {
        //find user from auht middleware
        const { uid } = req.user;
        // check if user exist
        const user = await db_1.prisma.user.findUnique({ where: { UID: uid } });
        if (!user)
            return res.status(400).json({ error: "user not found!" });
        const { videoUrl, players, lineUpImage } = req.body;
        const match = await db_1.prisma.matchRequest.create({
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
    }
    catch (e) {
        res.status(500).json({ error: e.message || "Something went wrong" });
    }
};
exports.requestMatchAnalysis = requestMatchAnalysis;
const allmatchRequestsOfUser = async (req, res) => {
    try {
        //find user from auht middleware
        const { uid } = req.user;
        // check if user exist
        const user = await db_1.prisma.user.findUnique({ where: { UID: uid } });
        if (!user)
            return res.status(400).json({ error: "user not found!" });
        const allMatchRequests = await db_1.prisma.matchRequest.findMany({
            //find all match analysis request by User
            where: {
                userId: user.UID,
            },
            //order by newest request
            orderBy: {
                createdAt: "desc",
            },
            //select the field to fetch
            select: {
                status: true,
                id: true,
                createdAt: true,
            },
        });
        return res.status(201).json({
            message: "Match requestes fetched successfully",
            data: allMatchRequests,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message || "Something went wrong" });
    }
};
exports.allmatchRequestsOfUser = allmatchRequestsOfUser;
const getSpecificMatchAnalysis = async (req, res) => {
    try {
        //find user from auht middleware
        const { uid } = req.user;
        // check if user exist
        const user = await db_1.prisma.user.findUnique({ where: { UID: uid } });
        if (!user)
            return res.status(400).json({ error: "user not found!" });
        //get the matchId
        const { matchId } = req.params;
        //if no matchId return error
        if (!matchId)
            return res.status(400).json({ error: "matchId not found!" });
        //check if matchId exist
        const isValidId = await db_1.prisma.matchRequest.findUnique({
            where: { id: matchId },
        });
        //if no id mathces return error
        if (!isValidId)
            return res.status(400).json({ error: "The match is not found" });
        const matchInfo = await db_1.prisma.matchRequest.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                videoUrl: true,
                status: true,
                players: {
                    select: {
                        name: true,
                        jerseyNumber: true,
                        position: true,
                    },
                },
                analysis: {
                    select: {
                        result: true,
                    },
                },
            },
        });
        return res.status(201).json({
            message: "Match information is successfully fetched!",
            data: matchInfo,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message || "Something went wrong" });
    }
};
exports.getSpecificMatchAnalysis = getSpecificMatchAnalysis;
const updateMatchStatus = async (req, res) => {
    try {
        const { uid } = req.user;
        const user = await db_1.prisma.user.findUnique({ where: { UID: uid } });
        if (!user)
            return res.status(404).json({ error: "User not found!" });
        const { matchId } = req.params;
        if (!matchId)
            return res.status(400).json({ error: "matchId not found!" });
        const match = await db_1.prisma.matchRequest.findUnique({
            where: { id: matchId },
        });
        if (!match)
            return res.status(404).json({ error: "Match not found!" });
        const { status } = req.body;
        if (!["PENDING", "PROCESSING", "COMPLETED"].includes(status))
            return res.status(400).json({ error: "Invalid or missing status" });
        await db_1.prisma.matchRequest.update({
            where: { id: matchId },
            data: { status },
        });
        return res
            .status(200)
            .json({ message: `Match status updated to ${status}` });
    }
    catch (e) {
        return res.status(500).json({ error: e.message || "Something went wrong" });
    }
};
exports.updateMatchStatus = updateMatchStatus;
