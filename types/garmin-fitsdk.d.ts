/**
 * Ambient typing for `@garmin/fitsdk` — Garmin's official FIT decoder
 * ships without `.d.ts` files. We only call two surfaces (`Stream` and
 * `Decoder`), so this declaration is intentionally narrow.
 */
declare module "@garmin/fitsdk" {
  export class Stream {
    static fromBuffer(buf: Buffer | Uint8Array): Stream;
  }

  export interface DecodeOptions {
    applyScaleAndOffset?: boolean;
    convertTypesToStrings?: boolean;
    convertDateTimesToDates?: boolean;
    expandSubFields?: boolean;
    expandComponents?: boolean;
    mergeHeartRates?: boolean;
    includeUnknownData?: boolean;
  }

  export interface DecodeResult {
    messages: Record<string, any[] | undefined> & {
      fileIdMesgs?: any[];
      fileCreatorMesgs?: any[];
      sportMesgs?: any[];
      sessionMesgs?: any[];
      lapMesgs?: any[];
      recordMesgs?: any[];
      eventMesgs?: any[];
      hrZoneMesgs?: any[];
    };
    errors: unknown[];
  }

  export class Decoder {
    constructor(stream: Stream);
    checkIntegrity(): boolean;
    read(options?: DecodeOptions): DecodeResult;
  }
}
