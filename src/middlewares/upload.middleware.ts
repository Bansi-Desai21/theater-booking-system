import { Injectable, NestMiddleware, Req } from "@nestjs/common";
import { Response, NextFunction } from "express";
import * as multer from "multer";
import { memoryStorage } from "multer";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

@Injectable()
export class UploadMiddleware implements NestMiddleware {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  use(@Req() req, res: Response, next: NextFunction) {
    const upload = multer({ storage: memoryStorage() }).single("image");

    upload(req, res, async (err) => {
      if (err) {
        console.error("File upload error:", err);
        return res
          .status(500)
          .json({ message: "File upload failed", error: err });
      }

      if (!req.file) {
        return next();
      }

      try {
        const result = await this.cloudinaryService.uploadFile(req.file);

        req.body.image = result.secure_url;

        next();
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res
          .status(500)
          .json({ message: "Cloudinary upload failed", error });
      }
    });
  }
}
