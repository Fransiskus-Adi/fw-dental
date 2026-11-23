import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "FW Dental",
    short_name: "FW Dental",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f9fd",
    theme_color: "#008080",
    icons: [192, 512].map((size) => ({
      src: `/icons/clinic-${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
    })),
    shortcuts: [{ name: "Staff portal", url: "/admin" }],
  };
}
