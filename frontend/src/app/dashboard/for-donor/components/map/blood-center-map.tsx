"use client";

import { GoogleMap, LoadScript, Marker, InfoWindow, Circle } from "@react-google-maps/api";
import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Droplet, Clock, Phone, Star, X } from "lucide-react";

interface BloodCenter {
    bloodCenterId: number;
    name: string;
    location: string;
    city: string;
    latitude: number;
    longitude: number;
    specialization?: string;
    directorFullName?: string;
    distance?: number;
}

interface BloodCenterMapProps {
    centers: BloodCenter[];
    userLocation: { lat: number; lng: number } | null;
    onCenterSelect?: (center: BloodCenter) => void;
    selectedCenter?: BloodCenter | null;
}

const mapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "12px",
};

const defaultCenter = {
    lat: 43.222,
    lng: 76.851,
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
        },
    ],
};

export function BloodCenterMap({
                                   centers,
                                   userLocation,
                                   onCenterSelect,
                                   selectedCenter,
                               }: BloodCenterMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeMarker, setActiveMarker] = useState<BloodCenter | null>(null);
    const [centerBounds, setCenterBounds] = useState<google.maps.LatLngBounds | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
        if (userLocation) {
            map.panTo(userLocation);
            map.setZoom(12);
        } else if (centers.length > 0 && centers[0].latitude && centers[0].longitude) {
            map.panTo({ lat: centers[0].latitude, lng: centers[0].longitude });
            map.setZoom(10);
        } else {
            map.panTo(defaultCenter);
            map.setZoom(11);
        }


        const bounds = new google.maps.LatLngBounds();
        centers.forEach((center) => {
            if (center.latitude && center.longitude) {
                bounds.extend({ lat: center.latitude, lng: center.longitude });
            }
        });
        if (userLocation) {
            bounds.extend(userLocation);
        }
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
            setCenterBounds(bounds);
        }
    }, [centers, userLocation]);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const handleMarkerClick = (center: BloodCenter) => {
        setActiveMarker(center);
        if (onCenterSelect) {
            onCenterSelect(center);
        }
        if (map && center.latitude && center.longitude) {
            map.panTo({ lat: center.latitude, lng: center.longitude });
            map.setZoom(15);
        }
    };

    const centerMapOnUser = () => {
        if (map && userLocation) {
            map.panTo(userLocation);
            map.setZoom(14);
        }
    };

    const getMarkerIcon = (isSelected: boolean) => {
        return {
            url: isSelected
                ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new google.maps.Size(32, 32),
        };
    };

    return (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
            <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-border">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={userLocation || defaultCenter}
                    zoom={12}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={mapOptions}
                >

                    {userLocation && (
                        <>
                            <Marker
                                position={userLocation}
                                icon={{
                                    url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                                    scaledSize: new google.maps.Size(32, 32),
                                }}
                                title="Your Location"
                            />
                            <Circle
                                center={userLocation}
                                radius={5000}
                                options={{
                                    fillColor: "#3b82f6",
                                    fillOpacity: 0.1,
                                    strokeColor: "#3b82f6",
                                    strokeOpacity: 0.3,
                                    strokeWeight: 1,
                                }}
                            />
                        </>
                    )}


                    {centers.map((center) => {
                        if (!center.latitude || !center.longitude) return null;
                        const isSelected = selectedCenter?.bloodCenterId === center.bloodCenterId;
                        return (
                            <Marker
                                key={center.bloodCenterId}
                                position={{ lat: center.latitude, lng: center.longitude }}
                                onClick={() => handleMarkerClick(center)}
                                icon={getMarkerIcon(isSelected)}
                                animation={isSelected ? google.maps.Animation.BOUNCE : undefined}
                            />
                        );
                    })}


                    {activeMarker && (
                        <InfoWindow
                            position={{
                                lat: activeMarker.latitude!,
                                lng: activeMarker.longitude!,
                            }}
                            onCloseClick={() => setActiveMarker(null)}
                        >
                            <div className="p-2 max-w-xs">
                                <h4 className="font-semibold text-foreground text-sm">
                                    {activeMarker.name}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {activeMarker.location}, {activeMarker.city}
                                </p>
                                {activeMarker.distance !== undefined && (
                                    <p className="text-xs text-primary mt-1 font-medium">
                                         {activeMarker.distance.toFixed(1)} km away
                                    </p>
                                )}
                                {activeMarker.specialization && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                         {activeMarker.specialization}
                                    </p>
                                )}
                                <Button
                                    size="sm"
                                    className="mt-2 w-full bg-primary hover:bg-primary/90 text-xs"
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeMarker.latitude},${activeMarker.longitude}`, "_blank")}
                                >
                                    Get Directions
                                </Button>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>

                {userLocation && (
                    <button
                        onClick={centerMapOnUser}
                        className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow z-10"
                    >
                        <Navigation className="w-5 h-5 text-primary" />
                    </button>
                )}
            </div>
        </LoadScript>
    );
}