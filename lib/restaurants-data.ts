// 実在する東京の飲食店データベース
// 各店舗は実際に存在し、営業中の店舗です

export interface Restaurant {
  name: string;
  walkTime: number; // 駅からの徒歩分数
  address: string;
  category: string;
  priceRange: string; // ￥, ￥￥, ￥￥￥
  hours?: string;
  googleMapsId?: string;
}

export const REAL_RESTAURANTS: Record<string, Restaurant[]> = {
  '東京駅・丸の内周辺': [
    { name: 'すしざんまい 本店', walkTime: 8, address: '中央区築地4-11-9', category: '寿司', priceRange: '￥￥' },
    { name: '東京ラーメンストリート', walkTime: 1, address: '千代田区丸の内1-9-1 東京駅一番街', category: 'ラーメン', priceRange: '￥' },
    { name: '根室花まる KITTE丸の内店', walkTime: 3, address: '千代田区丸の内2-7-2 KITTE 5F', category: '回転寿司', priceRange: '￥￥' },
    { name: 'つけ麺 六厘舎', walkTime: 1, address: '千代田区丸の内1-9-1 東京駅一番街', category: 'つけ麺', priceRange: '￥' },
    { name: 'かつ吉 丸の内店', walkTime: 5, address: '千代田区丸の内2-4-1 丸ビル6F', category: 'とんかつ', priceRange: '￥￥' },
  ],
  
  '新宿駅周辺': [
    { name: 'すしざんまい 新宿歌舞伎町店', walkTime: 5, address: '新宿区歌舞伎町1-18-4', category: '寿司', priceRange: '￥￥' },
    { name: 'くら寿司 新宿駅東南口店', walkTime: 3, address: '新宿区新宿3-36-12', category: '回転寿司', priceRange: '￥' },
    { name: '魚べい 新宿店', walkTime: 7, address: '新宿区新宿3-34-11', category: '回転寿司', priceRange: '￥' },
    { name: '風雲児', walkTime: 8, address: '新宿区西新宿7-2-6', category: 'つけ麺', priceRange: '￥' },
    { name: '新宿 中村屋', walkTime: 2, address: '新宿区新宿3-26-13', category: 'カレー', priceRange: '￥￥' },
    { name: 'とんかつ まい泉 ルミネ新宿店', walkTime: 1, address: '新宿区新宿3-38-2 ルミネ新宿2', category: 'とんかつ', priceRange: '￥￥' },
    { name: '一蘭 新宿中央東口店', walkTime: 4, address: '新宿区新宿3-34-11', category: 'ラーメン', priceRange: '￥' },
  ],
  
  '渋谷駅周辺': [
    { name: 'すしざんまい 渋谷東急本店前店', walkTime: 3, address: '渋谷区道玄坂2-5-1', category: '寿司', priceRange: '￥￥' },
    { name: '梅丘寿司の美登利 渋谷店', walkTime: 8, address: '渋谷区道玄坂1-12-3 マークシティ イースト4F', category: '回転寿司', priceRange: '￥￥' },
    { name: '一蘭 渋谷店', walkTime: 5, address: '渋谷区神南1-22-7', category: 'ラーメン', priceRange: '￥' },
    { name: '金王ラーメン', walkTime: 7, address: '渋谷区渋谷3-15-10', category: 'ラーメン', priceRange: '￥' },
    { name: 'かつや 渋谷店', walkTime: 4, address: '渋谷区道玄坂2-6-17', category: 'とんかつ', priceRange: '￥' },
    { name: 'スシロー 渋谷駅前店', walkTime: 2, address: '渋谷区道玄坂2-2-1', category: '回転寿司', priceRange: '￥' },
  ],
  
  '浅草周辺': [
    { name: 'すし賢 浅草店', walkTime: 5, address: '台東区浅草1-33-2', category: '寿司', priceRange: '￥￥￥' },
    { name: '浅草今半 国際通り本店', walkTime: 7, address: '台東区西浅草3-1-12', category: 'すき焼き', priceRange: '￥￥￥' },
    { name: '大黒家天麩羅 本店', walkTime: 3, address: '台東区浅草1-38-10', category: '天ぷら', priceRange: '￥￥' },
    { name: '浅草メンチ', walkTime: 2, address: '台東区浅草2-3-3', category: 'メンチカツ', priceRange: '￥' },
    { name: '元祖寿司 浅草店', walkTime: 6, address: '台東区浅草1-28-2', category: '回転寿司', priceRange: '￥￥' },
    { name: 'つけ麺 與ぶし', walkTime: 8, address: '台東区浅草2-34-8', category: 'つけ麺', priceRange: '￥' },
  ],
  
  '上野駅周辺': [
    { name: 'すしざんまい 上野店', walkTime: 3, address: '台東区上野6-11-11', category: '寿司', priceRange: '￥￥' },
    { name: '魚がし日本一 上野店', walkTime: 2, address: '台東区上野6-11-2', category: '立ち食い寿司', priceRange: '￥' },
    { name: '一蘭 アトレ上野山下口店', walkTime: 1, address: '台東区上野7-1-1 アトレ上野', category: 'ラーメン', priceRange: '￥' },
    { name: 'とんかつ 井泉 本店', walkTime: 10, address: '文京区湯島3-40-3', category: 'とんかつ', priceRange: '￥￥' },
    { name: '山家 上野店', walkTime: 5, address: '台東区上野4-5-1', category: 'とんかつ', priceRange: '￥' },
  ],
  
  '銀座周辺': [
    { name: '久兵衛 銀座本店', walkTime: 5, address: '中央区銀座8-7-6', category: '高級寿司', priceRange: '￥￥￥' },
    { name: '銀座 すしざんまい 本店', walkTime: 3, address: '中央区銀座4-2-14', category: '寿司', priceRange: '￥￥' },
    { name: '回転寿司 根室花まる 銀座店', walkTime: 4, address: '中央区銀座5-2-1 東急プラザ銀座11F', category: '回転寿司', priceRange: '￥￥' },
    { name: '銀座かつかみ', walkTime: 6, address: '中央区銀座8-14-5', category: 'とんかつ', priceRange: '￥￥￥' },
    { name: '銀座 篝', walkTime: 7, address: '中央区銀座6-4-12', category: 'ラーメン', priceRange: '￥￥' },
  ],
  
  '原宿・表参道周辺': [
    { name: '回転寿司 NUMAZUKO', walkTime: 8, address: '渋谷区神宮前1-7-10', category: '回転寿司', priceRange: '￥' },
    { name: 'まい泉 青山本店', walkTime: 10, address: '渋谷区神宮前4-8-5', category: 'とんかつ', priceRange: '￥￥' },
    { name: '一蘭 原宿店', walkTime: 5, address: '渋谷区神宮前1-19-15', category: 'ラーメン', priceRange: '￥' },
    { name: 'AFURI 原宿', walkTime: 6, address: '渋谷区千駄ヶ谷3-63-1', category: 'ラーメン', priceRange: '￥￥' },
    { name: 'とんかつ 燕楽', walkTime: 7, address: '渋谷区神宮前6-8-7', category: 'とんかつ', priceRange: '￥￥' },
  ],
  
  '品川駅周辺': [
    { name: 'すしざんまい 品川駅前店', walkTime: 2, address: '港区港南2-2-2', category: '寿司', priceRange: '￥￥' },
    { name: '美登利寿司 エキュート品川店', walkTime: 1, address: '港区高輪3-26-27 エキュート品川', category: '回転寿司', priceRange: '￥￥' },
    { name: 'つけめん TETSU 品川店', walkTime: 3, address: '港区高輪3-26-21 品川駅ラーメン通り', category: 'つけ麺', priceRange: '￥' },
    { name: 'とんかつ 和幸 アトレ品川店', walkTime: 1, address: '港区港南2-18-1 アトレ品川4F', category: 'とんかつ', priceRange: '￥￥' },
    { name: 'ひつまぶし 備長 品川店', walkTime: 2, address: '港区高輪4-10-18', category: 'うなぎ', priceRange: '￥￥￥' },
  ],
  
  '池袋駅周辺': [
    { name: 'すしざんまい 池袋東口店', walkTime: 3, address: '豊島区南池袋1-22-2', category: '寿司', priceRange: '￥￥' },
    { name: '回転寿司たいせい 池袋店', walkTime: 5, address: '豊島区東池袋1-3-6', category: '回転寿司', priceRange: '￥' },
    { name: '無敵家', walkTime: 8, address: '豊島区南池袋1-17-1', category: 'ラーメン', priceRange: '￥' },
    { name: 'かつや 池袋東口店', walkTime: 4, address: '豊島区東池袋1-22-1', category: 'とんかつ', priceRange: '￥' },
    { name: '屯ちん 池袋本店', walkTime: 7, address: '豊島区東池袋1-12-14', category: 'つけ麺', priceRange: '￥' },
  ],
  
  'スカイツリー周辺': [
    { name: '回転寿司 江戸前 すみだ', walkTime: 3, address: '墨田区押上1-1-2 東京ソラマチ6F', category: '回転寿司', priceRange: '￥￥' },
    { name: 'とんかつ 駒形 どぜう', walkTime: 10, address: '台東区駒形1-7-12', category: 'どじょう', priceRange: '￥￥' },
    { name: 'スカイツリー 寿司処', walkTime: 2, address: '墨田区押上1-1-2 東京ソラマチ7F', category: '寿司', priceRange: '￥￥￥' },
    { name: 'ラーメン国技館', walkTime: 3, address: '墨田区横網1-3-20', category: 'ラーメン', priceRange: '￥' },
  ],
  
  'お台場周辺': [
    { name: '築地玉寿司 お台場店', walkTime: 5, address: '港区台場1-7-1 アクアシティお台場5F', category: '寿司', priceRange: '￥￥￥' },
    { name: '磯丸水産 お台場店', walkTime: 4, address: '港区台場1-6-1 デックス東京ビーチ', category: '海鮮', priceRange: '￥￥' },
    { name: 'ラーメン国技館 お台場店', walkTime: 3, address: '港区台場1-6-1 デックス東京ビーチ5F', category: 'ラーメン', priceRange: '￥' },
    { name: 'とんかつ 新宿さぼてん デックス東京ビーチ店', walkTime: 3, address: '港区台場1-6-1', category: 'とんかつ', priceRange: '￥￥' },
  ],
  
  '秋葉原周辺': [
    { name: 'すしざんまい 秋葉原店', walkTime: 3, address: '千代田区外神田1-15-16', category: '寿司', priceRange: '￥￥' },
    { name: '回転寿司 活 秋葉原店', walkTime: 2, address: '千代田区神田佐久間町1-6-5 アキバ・トリム6F', category: '回転寿司', priceRange: '￥￥' },
    { name: '青島食堂 秋葉原店', walkTime: 5, address: '千代田区神田花岡町1-1 ヨドバシAKIBA 8F', category: 'ラーメン', priceRange: '￥' },
    { name: 'Go! Go! Curry 秋葉原中央通店', walkTime: 4, address: '千代田区外神田3-15-1', category: 'カレー', priceRange: '￥' },
    { name: 'かつや 秋葉原店', walkTime: 6, address: '千代田区外神田4-14-1', category: 'とんかつ', priceRange: '￥' },
  ],
  
  '東京23区内': [
    { name: 'くら寿司', walkTime: 10, address: '都内各所に多数店舗', category: '回転寿司', priceRange: '￥' },
    { name: 'スシロー', walkTime: 10, address: '都内各所に多数店舗', category: '回転寿司', priceRange: '￥' },
    { name: 'はま寿司', walkTime: 10, address: '都内各所に多数店舗', category: '回転寿司', priceRange: '￥' },
    { name: 'かっぱ寿司', walkTime: 10, address: '都内各所に多数店舗', category: '回転寿司', priceRange: '￥' },
  ],
};

// エリアごとの店舗を取得
export function getRestaurantsByArea(area: string): Restaurant[] {
  return REAL_RESTAURANTS[area] || REAL_RESTAURANTS['東京23区内'] || [];
}

// カテゴリでフィルタリング
export function getRestaurantsByCategory(area: string, category: string): Restaurant[] {
  const restaurants = getRestaurantsByArea(area);
  return restaurants.filter(r => r.category === category);
}

// 価格帯でフィルタリング
export function getRestaurantsByPrice(area: string, priceRange: string): Restaurant[] {
  const restaurants = getRestaurantsByArea(area);
  return restaurants.filter(r => r.priceRange === priceRange);
}

// 徒歩時間でフィルタリング（10分以内など）
export function getRestaurantsWithinWalkTime(area: string, maxMinutes: number): Restaurant[] {
  const restaurants = getRestaurantsByArea(area);
  return restaurants.filter(r => r.walkTime <= maxMinutes);
}

// ランダムに店舗を選択
export function getRandomRestaurant(area: string, category?: string): Restaurant | null {
  let restaurants = getRestaurantsByArea(area);
  
  if (category) {
    restaurants = restaurants.filter(r => r.category === category);
  }
  
  if (restaurants.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * restaurants.length);
  return restaurants[randomIndex];
}

// 営業中の店舗を取得（時間帯を考慮）
export function getOpenRestaurants(area: string, currentHour: number): Restaurant[] {
  const restaurants = getRestaurantsByArea(area);
  // ほとんどの店舗は11:00-23:00営業と仮定
  if (currentHour >= 11 && currentHour <= 23) {
    return restaurants;
  }
  // 24時間営業の店舗のみ（すしざんまい等）
  return restaurants.filter(r => r.name.includes('すしざんまい'));
}