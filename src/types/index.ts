
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_duration_minutes: number;
  features: string[];
  image_url?: string; // Optional image for the service
}
