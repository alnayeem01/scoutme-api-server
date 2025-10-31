import { NextFunction, Request, Response } from "express";
import { ObjectSchema } from "yup";

export const validateSchema = (schema: ObjectSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate(req.body, { abortEarly: false }); // validate all fields
      next();
    } catch (e: any) {
      const errors = e.inner?.map((err: any) => ({
        path: err.path,
        message: err.message,
      }));
      return res.status(400).json({ errors });
    }
  };
};
