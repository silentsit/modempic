import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function configureCloudinaryFromEnv(): void {
  if (configured) return;
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
  } else {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud_name || !api_key || !api_secret) {
      throw new Error(
        "Cloudinary credentials missing: set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET",
      );
    }
    cloudinary.config({ cloud_name, api_key, api_secret });
  }
  configured = true;
}

/**
 * Upload a raster image to Cloudinary. Returns `secure_url` for storing in `ProductImage.url`.
 * Uses `CLOUDINARY_UPLOAD_FOLDER` (default `modempic/products`) + `publicIdPath` as the asset path.
 */
export async function uploadImageBufferToCloudinary(opts: {
  buffer: Buffer;
  contentType: string | null;
  /** Path under the upload folder, e.g. `buy-modalert-200-mg/00-deadbeef123456` (no leading slash). */
  publicIdPath: string;
}): Promise<string> {
  configureCloudinaryFromEnv();
  const folder = (process.env.CLOUDINARY_UPLOAD_FOLDER ?? "modempic/products").replace(/^\/+|\/+$/g, "");
  const public_id = `${folder}/${opts.publicIdPath}`.replace(/\/+/g, "/");
  const mime = opts.contentType?.split(";")[0]?.trim() || "image/jpeg";
  const dataUri = `data:${mime};base64,${opts.buffer.toString("base64")}`;

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUri,
      {
        public_id,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
        unique_filename: false,
      },
      (err, res) => {
        if (err) reject(err);
        else if (!res?.secure_url) reject(new Error("Cloudinary upload returned no secure_url"));
        else resolve({ secure_url: res.secure_url });
      },
    );
  });

  return result.secure_url;
}
