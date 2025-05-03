
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
  namespace Symbol {
    function arrowHead(options: {
      pixelSize: number;
      polygon?: boolean;
      pathOptions: PathOptions;
    }): any;
  }
  interface Leaflet {
    curve: (path: string[], options?: L.Curve.CurveOptions) => L.Polyline;
  }

  function polylineDecorator(latlngs: LatLngExpression, options?: PolylineDecoratorOptions): PolylineDecorator;

}

export {};
