import { ImageResponse } from "next/og";
import { loadFraunceSliceForIcon } from "@/lib/og-fonts";

export const dynamic = "force-static";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const { italic } = await loadFraunceSliceForIcon();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          fontFamily: "Fraunces",
          letterSpacing: "-0.04em",
          fontSize: 60,
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#1a1613", fontWeight: 700, fontStyle: "italic" }}>
          t
        </span>
        <span style={{ color: "#b4471f", fontWeight: 700, fontStyle: "italic" }}>
          t
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: italic, weight: 700, style: "italic" },
      ],
    },
  );
}
