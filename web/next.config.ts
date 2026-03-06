import type { NextConfig } from "next";

const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME ?? "";
const s3Region = process.env.NEXT_PUBLIC_S3_REGION ?? "eu-central-1";
const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN ?? "";
const isDev = process.env.NODE_ENV === "development";

const imgSrcExtra = [
  cdnDomain ? `https://${cdnDomain}` : "",
  s3Bucket ? `https://${s3Bucket}.s3.${s3Region}.amazonaws.com` : "",
  isDev ? "http://localhost:8000" : "",
].filter(Boolean).join(" ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${imgSrcExtra}; connect-src 'self'; font-src 'self'; frame-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      ...(isDev
        ? [
            { protocol: "http" as const, hostname: "localhost", port: "8000", pathname: "/media/**" },
          ]
        : []),
      {
        protocol: "https" as const,
        hostname: "**.karekontrol.com",
        pathname: "/**",
      },
      ...(s3Bucket
        ? [{ protocol: "https" as const, hostname: `${s3Bucket}.s3.${s3Region}.amazonaws.com`, pathname: "/**" }]
        : []),
      ...(cdnDomain
        ? [{ protocol: "https" as const, hostname: cdnDomain, pathname: "/**" }]
        : []),
    ],
  },
};

export default nextConfig;
