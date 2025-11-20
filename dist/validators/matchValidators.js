"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchRequestSchema = void 0;
const yup = __importStar(require("yup"));
const constant_1 = require("../utils/constant");
exports.matchRequestSchema = yup.object().shape({
    videoUrl: yup
        .string()
        .url("Video URL must be a valid URL")
        .required("Video URL is required"),
    lineUpUrl: yup.string().url("Lineup URL must be valid!").nullable(),
    players: yup
        .array()
        .of(yup.object().shape({
        name: yup.string().required("Player name is required!"),
        jerseyNumber: yup
            .number()
            .typeError("Jersey number must be a number!")
            .required("Jersey number is required!"),
        position: yup
            .string()
            .oneOf(constant_1.playerPostition, "Position must be one of the allowed roles!")
            .required("Position is required!"),
        team: yup.string().nullable(),
    }))
        .required("Players list is required")
        .min(11, "You must provide exactly 11 players")
        .max(11, "You must provide exactly 11 players"),
});
