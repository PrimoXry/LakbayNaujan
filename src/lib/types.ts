export type Profile = { id: string; username: string; role: 'user' | 'admin' };

export type TouristSpot = {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  entrance_fee: string | null;
  opening_hours: string | null;
  best_time_to_visit: string | null;
  bucket_list: string[];
  created_by: string;
  created_at: string;
};

export type NearbyPlace = {
  id: string;
  spot_id: string;
  name: string;
  kind: 'Carinderia' | 'Sari-sari Store' | 'Other';
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type NearbyDraft = Omit<NearbyPlace, 'id' | 'spot_id'>;

export function mapsDirections(place: {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}): string {
  const location = place.latitude !== null && place.longitude !== null
    ? `${place.latitude},${place.longitude}`
    : `${place.name}, ${place.address}, Naujan, Oriental Mindoro, Philippines`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
}

export function mapsSearch(place: {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}): string {
  const location = place.latitude !== null && place.longitude !== null
    ? `${place.latitude},${place.longitude}`
    : `${place.name}, ${place.address}, Naujan, Oriental Mindoro, Philippines`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function openMaps(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
