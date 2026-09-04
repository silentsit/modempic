import { describe, expect, it } from "vitest";
import { productImageDeliveryUrl, productImageSrcSet, withCloudinaryDeliveryTransforms } from "./cloudinary-delivery-url";

describe("cloudinary delivery URLs", () => {
  const raw = "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg";

  it("inserts f_auto/q_auto width transforms", () => {
    expect(withCloudinaryDeliveryTransforms(raw, { width: 480 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_480,c_limit,f_auto,q_auto/v1/sample.jpg",
    );
  });

  it("replaces an existing transform segment instead of stacking", () => {
    const already = productImageDeliveryUrl(raw, "card");
    expect(withCloudinaryDeliveryTransforms(already, { width: 800 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_800,c_limit,f_auto,q_auto/v1/sample.jpg",
    );
  });

  it("builds a srcset for listing cards and leaves local paths alone", () => {
    expect(productImageSrcSet(raw, [320, 480])).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_320,c_limit,f_auto,q_auto/v1/sample.jpg 320w, https://res.cloudinary.com/demo/image/upload/w_480,c_limit,f_auto,q_auto/v1/sample.jpg 480w",
    );
    expect(productImageSrcSet("/hero/modalert-200.png", [480])).toBeUndefined();
  });
});
