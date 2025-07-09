import multer from "multer";
import { CustomResponse, ExtendedRequest, NextFunction } from "../core/type";

const upload = multer({
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
  storage: multer.memoryStorage(), // Keep files in memory
});

export function multerAnyMiddleware() {
  const anyHandler = upload.any();

  return (req: ExtendedRequest, res: CustomResponse, next: NextFunction) => {
    // Multer expects Express-style req/res, so we'll "fake" it
    const expressReq = req as any;
    const expressRes = res as any;

    anyHandler(expressReq, expressRes, (err: any) => {
      if (err) {
        res.statusCode = 400;
        res.json({ error: err.message });
        return;
      }

      // Attach parsed fields to real request
      req.body = expressReq.body;
      (req as any).files = expressReq.files;

      next();
    });
  };
}
