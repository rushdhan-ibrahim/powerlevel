declare module "heic-convert" {
  type ConvertOptions = {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  };
  const convert: (opts: ConvertOptions) => Promise<ArrayBuffer>;
  export default convert;
}
