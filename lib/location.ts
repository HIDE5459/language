export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  area?: string;
}

export interface LocationError {
  code: number;
  message: string;
}

export class LocationService {
  static async getCurrentLocation(): Promise<LocationData | LocationError> {
    console.log('位置情報取得を開始...');
    
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('位置情報がサポートされていません');
        resolve({
          code: 1,
          message: '位置情報がサポートされていません'
        });
        return;
      }

      console.log('navigator.geolocation 利用可能');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('位置情報取得成功:', position.coords);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.log('位置情報取得エラー:', error);
          resolve({
            code: error.code,
            message: this.getErrorMessage(error.code)
          });
        },
        {
          enableHighAccuracy: false, // 精度を下げて取得しやすく
          timeout: 15000, // タイムアウトを延長
          maximumAge: 600000 // 10分間キャッシュ
        }
      );
    });
  }

  private static getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return '位置情報の使用が拒否されました';
      case 2:
        return '位置情報を取得できませんでした';
      case 3:
        return '位置情報の取得がタイムアウトしました';
      default:
        return '位置情報の取得でエラーが発生しました';
    }
  }

  // 詳細な東京エリア判定（徒歩10分圏内での具体的提案のため）
  static getTokyoArea(lat: number, lng: number): string {
    // より精密な座標でのエリア判定
    
    // 東京駅・丸の内周辺
    if (lat >= 35.675 && lat <= 35.685 && lng >= 139.760 && lng <= 139.775) {
      return '東京駅・丸の内周辺';
    }
    
    // 新宿駅周辺
    if (lat >= 35.685 && lat <= 35.695 && lng >= 139.695 && lng <= 139.705) {
      return '新宿駅周辺';
    }
    
    // 渋谷駅周辺
    if (lat >= 35.655 && lat <= 35.665 && lng >= 139.695 && lng <= 139.705) {
      return '渋谷駅周辺';
    }
    
    // 浅草駅・浅草寺周辺
    if (lat >= 35.710 && lat <= 35.720 && lng >= 139.790 && lng <= 139.800) {
      return '浅草周辺';
    }
    
    // 上野駅・上野公園周辺
    if (lat >= 35.710 && lat <= 35.720 && lng >= 139.770 && lng <= 139.780) {
      return '上野駅周辺';
    }
    
    // 銀座周辺
    if (lat >= 35.665 && lat <= 35.675 && lng >= 139.760 && lng <= 139.770) {
      return '銀座周辺';
    }
    
    // 原宿・表参道周辺
    if (lat >= 35.665 && lat <= 35.675 && lng >= 139.700 && lng <= 139.710) {
      return '原宿・表参道周辺';
    }
    
    // 品川駅周辺
    if (lat >= 35.625 && lat <= 35.635 && lng >= 139.735 && lng <= 139.745) {
      return '品川駅周辺';
    }
    
    // 池袋駅周辺
    if (lat >= 35.725 && lat <= 35.735 && lng >= 139.705 && lng <= 139.715) {
      return '池袋駅周辺';
    }
    
    // スカイツリー周辺
    if (lat >= 35.705 && lat <= 35.715 && lng >= 139.810 && lng <= 139.820) {
      return 'スカイツリー周辺';
    }
    
    // お台場周辺
    if (lat >= 35.620 && lat <= 35.640 && lng >= 139.770 && lng <= 139.790) {
      return 'お台場周辺';
    }
    
    // 秋葉原周辺
    if (lat >= 35.695 && lat <= 35.705 && lng >= 139.770 && lng <= 139.780) {
      return '秋葉原周辺';
    }
    
    // その他東京23区内
    if (lat >= 35.600 && lat <= 35.750 && lng >= 139.650 && lng <= 139.850) {
      return '東京23区内';
    }
    
    // 東京都内（多摩地区含む）
    if (lat >= 35.500 && lat <= 35.900 && lng >= 139.200 && lng <= 139.900) {
      return '東京都内';
    }
    
    return '現在地';
  }
}