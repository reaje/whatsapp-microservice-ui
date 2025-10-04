import { useState, useEffect } from 'react';
import { MapPin, Loader2, Send, X, Navigation } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  onCancel?: () => void;
}

export default function LocationPicker({
  onLocationSelect,
  onCancel
}: LocationPickerProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        setLocation(loc);

        // Try to get address from coordinates using reverse geocoding
        try {
          const addressName = await reverseGeocode(loc.latitude, loc.longitude);
          setAddress(addressName);
          loc.address = addressName;
          setLocation(loc);
        } catch (err) {
          console.error('Error getting address:', err);
        }

        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Não foi possível obter sua localização';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada. Habilite nas configurações do navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informações de localização não disponíveis.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo esgotado ao buscar localização.';
            break;
        }

        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get address');
    }

    const data = await response.json();
    return data.display_name || 'Endereço não disponível';
  };

  const handleSend = () => {
    if (location) {
      onLocationSelect(location);
    }
  };

  const getStaticMapUrl = (lat: number, lng: number): string => {
    // Using OpenStreetMap static map service
    const zoom = 15;
    const width = 600;
    const height = 400;

    // Using staticmap.openstreetmap.de service
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},red-pushpin`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Enviar Localização</h3>
              <p className="text-sm text-gray-500">
                Compartilhe sua localização atual
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Cancelar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-gray-600">Obtendo sua localização...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={getCurrentLocation}
                className="mt-3 text-sm text-red-700 font-medium hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {location && !loading && (
            <>
              {/* Map Preview */}
              <div className="relative rounded-lg overflow-hidden border border-gray-200 mb-4">
                <img
                  src={getStaticMapUrl(location.latitude, location.longitude)}
                  alt="Mapa"
                  className="w-full h-80 object-cover"
                  onError={(e) => {
                    // Fallback to a simple placeholder if map fails to load
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Crect fill="%23e5e7eb" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%236b7280" font-size="16" font-family="Arial"%3EMapa não disponível%3C/text%3E%3C/svg%3E';
                  }}
                />

                {/* Location Pin Overlay */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full">
                  <MapPin className="w-10 h-10 text-red-500 drop-shadow-lg" fill="currentColor" />
                </div>
              </div>

              {/* Location Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Sua Localização
                    </h4>

                    {address ? (
                      <p className="text-sm text-gray-600 mb-3">
                        {address}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mb-3 italic">
                        Endereço não disponível
                      </p>
                    )}

                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <p>
                        <span className="font-medium">Latitude:</span>{' '}
                        {location.latitude.toFixed(6)}
                      </p>
                      <p>
                        <span className="font-medium">Longitude:</span>{' '}
                        {location.longitude.toFixed(6)}
                      </p>
                    </div>

                    {/* Google Maps Link */}
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-sm text-primary hover:underline"
                    >
                      Abrir no Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {location && !loading && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={getCurrentLocation}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Atualizar Localização
            </button>

            <button
              onClick={handleSend}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Send className="w-5 h-5" />
              Enviar Localização
            </button>
          </div>
        )}

        {/* Info */}
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            💡 Sua localização será compartilhada com precisão de GPS
          </p>
        </div>
      </div>
    </div>
  );
}
