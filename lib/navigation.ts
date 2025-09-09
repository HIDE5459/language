export interface NavigationLink {
  googleMaps: string;
  appleMaps: string;
  webMaps: string;
}

export class NavigationService {
  // Google Maps ナビゲーションリンクを生成
  static createGoogleMapsLink(destination: string, origin?: string): string {
    const baseUrl = 'https://maps.google.com/';
    const params = new URLSearchParams();
    
    if (origin) {
      params.append('saddr', origin);
    }
    params.append('daddr', destination);
    params.append('dir_transit', '1'); // 電車優先
    
    return `${baseUrl}?${params.toString()}`;
  }

  // Apple Maps ナビゲーションリンクを生成
  static createAppleMapsLink(destination: string, origin?: string): string {
    const params = new URLSearchParams();
    
    if (origin) {
      params.append('saddr', origin);
    }
    params.append('daddr', destination);
    params.append('dirflg', 'r'); // 公共交通機関
    
    return `maps://?${params.toString()}`;
  }

  // Web用 Google Maps リンクを生成（ブラウザで開く）
  static createWebMapsLink(destination: string, origin?: string): string {
    const baseUrl = 'https://www.google.com/maps/dir/';
    const fromParam = origin ? encodeURIComponent(origin) : 'Your+Location';
    const toParam = encodeURIComponent(destination);
    
    return `${baseUrl}${fromParam}/${toParam}/@35.6762,139.6503,12z/data=!3m1!4b1!4m2!4m1!3e3`; // 3e3は公共交通機関
  }

  // 全種類のナビリンクを生成
  static createNavigationLinks(destination: string, origin?: string): NavigationLink {
    return {
      googleMaps: this.createGoogleMapsLink(destination, origin),
      appleMaps: this.createAppleMapsLink(destination, origin),
      webMaps: this.createWebMapsLink(destination, origin)
    };
  }

  // マークダウン形式でナビリンクを生成
  static formatNavigationLinks(destination: string, origin?: string): string {
    const links = this.createNavigationLinks(destination, origin);
    
    return `📍 ${destination}への経路:
🗺️ [Google Maps](${links.webMaps})
🍎 [Apple Maps](${links.appleMaps})
🌐 [ナビを開く](${links.googleMaps})`;
  }

  // 東京の主要スポットの座標データ
  static getTokyoSpotCoordinates(spotName: string): { lat: number; lng: number } | null {
    const coordinates: Record<string, { lat: number; lng: number }> = {
      '東京駅': { lat: 35.6812, lng: 139.7671 },
      '新宿駅': { lat: 35.6896, lng: 139.7006 },
      '渋谷駅': { lat: 35.6580, lng: 139.7016 },
      '浅草寺': { lat: 35.7148, lng: 139.7967 },
      '浅草': { lat: 35.7148, lng: 139.7967 },
      '上野駅': { lat: 35.7141, lng: 139.7774 },
      '銀座': { lat: 35.6720, lng: 139.7648 },
      '原宿駅': { lat: 35.6702, lng: 139.7016 },
      '表参道': { lat: 35.6657, lng: 139.7085 },
      '品川駅': { lat: 35.6284, lng: 139.7387 },
      '池袋駅': { lat: 35.7295, lng: 139.7109 },
      '東京スカイツリー': { lat: 35.7101, lng: 139.8107 },
      'スカイツリー': { lat: 35.7101, lng: 139.8107 },
      'お台場': { lat: 35.6269, lng: 139.7793 },
      '秋葉原駅': { lat: 35.6984, lng: 139.7731 },
      '秋葉原': { lat: 35.6984, lng: 139.7731 },
    };
    
    return coordinates[spotName] || null;
  }

  // 座標ベースでのナビリンク生成
  static createNavigationLinksWithCoords(lat: number, lng: number, name: string, origin?: string): NavigationLink {
    const destination = `${lat},${lng}`;
    const displayName = name;
    
    return {
      googleMaps: this.createGoogleMapsLink(destination, origin),
      appleMaps: this.createAppleMapsLink(destination, origin),
      webMaps: this.createWebMapsLink(`${displayName} ${destination}`, origin)
    };
  }
}