// Minimal ambient type declarations for PlayCanvas namespace used in TS types
// This avoids linter errors where we reference pc.* types while using the shimmed runtime.

declare namespace pc {
  type Application = any;
  type Entity = any;
  type Vec3 = any;
  type Color = any;
  type StandardMaterial = any;
  type Material = any;
}

declare namespace pc {
  const LIGHTTYPE_DIRECTIONAL: number;
  const LIGHTTYPE_OMNI: number;
  const LIGHTTYPE_SPOT: number;
  const FOG_LINEAR: number;
}

declare module 'playcanvas' {
  const pcNamespace: any;
  export = pcNamespace;
}

