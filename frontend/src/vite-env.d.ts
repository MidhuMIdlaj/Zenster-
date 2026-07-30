/// <reference types="vite/client" />

// Google Maps API type definitions
declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
      panTo(latlng: LatLng | LatLngLiteral): void;
      getCenter(): LatLng;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng | LatLngLiteral): void;
      setTitle(title: string): void;
      addListener(eventName: string, callback: Function): void;
      setIcon(icon: string | Icon | Symbol): void;
      getPosition(): LatLng | null;
      setAnimation(animation: Animation): void;
    }

    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      open(map?: Map | StreetViewPanorama | null, anchor?: MVCObject): void;
      close(): void;
      setContent(content: string | HTMLElement): void;
    }

    class Circle {
      constructor(options?: CircleOptions);
      setMap(map: Map | null): void;
      setCenter(center: LatLng | LatLngLiteral): void;
      setRadius(radius: number): void;
    }

    class Polyline {
      constructor(options?: PolylineOptions);
      setMap(map: Map | null): void;
      setPath(path: Array<LatLng | LatLngLiteral>): void;
    }

    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      contains(latLng: LatLng | LatLngLiteral): boolean;
      equals(other: LatLngBounds | null): boolean;
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      isEmpty(): boolean;
      toSpan(): LatLng;
      toString(): string;
      toUrlValue(precision?: number): string;
      union(other: LatLngBounds): LatLngBounds;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      styles?: MapTypeStyle[];
      [key: string]: any;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: google.maps.Map | null;
      title?: string;
      icon?: string | Icon | Symbol;
      label?: string;
      animation?: Animation;
      [key: string]: any;
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement;
      disableAutoPan?: boolean;
      maxWidth?: number;
      pixelOffset?: Size;
      position?: LatLng | LatLngLiteral;
      zIndex?: number;
      [key: string]: any;
    }

    interface CircleOptions {
      center?: LatLng | LatLngLiteral;
      map?: Map | null;
      radius?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      [key: string]: any;
    }

    interface PolylineOptions {
      path?: Array<LatLng | LatLngLiteral>;
      map?: Map | null;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      geodesic?: boolean;
      [key: string]: any;
    }

    interface MapTypeStyle {
      elementType?: string;
      featureType?: string;
      stylers?: MapTypeStyler[];
    }

    interface MapTypeStyler {
      [key: string]: string | number | boolean;
    }

    interface Icon {
      url: string;
      scaledSize?: Size;
      origin?: Point;
      anchor?: Point;
    }

    interface Symbol {
      path: string | SymbolPath;
      fillColor?: string;
      fillOpacity?: number;
      scale?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }

    interface Size {
      width: number;
      height: number;
      ctor?(width: number, height: number): Size;
    }

    interface Point {
      x: number;
      y: number;
      ctor?(x: number, y: number): Point;
    }

    interface Padding {
      bottom?: number;
      left?: number;
      right?: number;
      top?: number;
    }

    class MVCObject {
      addListener(eventName: string, callback: (...args: any[]) => void): void;
    }

    class StreetViewPanorama {
      constructor(container: HTMLElement, options?: StreetViewPanoramaOptions);
    }

    interface StreetViewPanoramaOptions {
      [key: string]: any;
    }

    enum SymbolPath {
      CIRCLE = 'CIRCLE',
      FORWARD_CLOSED_ARROW = 'FORWARD_CLOSED_ARROW',
      FORWARD_OPEN_ARROW = 'FORWARD_OPEN_ARROW',
      BACKWARD_CLOSED_ARROW = 'BACKWARD_CLOSED_ARROW',
      BACKWARD_OPEN_ARROW = 'BACKWARD_OPEN_ARROW',
    }

    enum Animation {
      BOUNCE = 'BOUNCE',
      DROP = 'DROP',
    }

    const MapTypeId: {
      ROADMAP: string;
      SATELLITE: string;
      HYBRID: string;
      TERRAIN: string;
    };

    namespace event {
      function addListener(
        instance: MVCObject,
        eventName: string,
        handler: Function,
      ): MapsEventListener;
      function addListenerOnce(
        instance: MVCObject,
        eventName: string,
        handler: Function,
      ): MapsEventListener;
      function removeListener(listener: MapsEventListener): void;
    }

    interface MapsEventListener {
      remove(): void;
    }
  }
}

interface Window {
  google: typeof google;
}
