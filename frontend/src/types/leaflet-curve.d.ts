
import * as L from 'leaflet';
import 'leaflet-curve'; 
import L from 'leaflet';

declare module 'leaflet' {
  namespace Curve {
    interface CurveOptions {
      color?: string;
      weight?: number;
      opacity?: number;
    }
  }

  interface Leaflet {
    curve: (path: string[], options?: L.Curve.CurveOptions) => L.Polyline;
  }

  export function polylineDecorator(polyline: Polyline<LineString | MultiLineString, any>, arg1: { patterns: { offset: string; repeat: string; symbol: any; }[]; }) {
    throw new Error('Function not implemented.');
  }
}

export {};
