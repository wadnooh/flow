import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function InteractiveMap({
  sites = [],
  selectedSite = null,
  onMapClick = null,
  previewCoordinates = null,
  previewRadius = 150,
  activeWorkers = [],
  height = "420px"
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (Riyadh)
    const initialLat = previewCoordinates?.lat || (sites.length > 0 ? sites[0].latitude : 24.774265);
    const initialLon = previewCoordinates?.lon || (sites.length > 0 ? sites[0].longitude : 46.738586);

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);

      map.on('click', (e) => {
        if (onMapClick) {
          onMapClick({
            lat: parseFloat(e.latlng.lat.toFixed(6)),
            lon: parseFloat(e.latlng.lng.toFixed(6))
          });
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and circles whenever sites, preview, or selection change
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    const group = layersGroupRef.current;
    group.clearLayers();

    // Custom Icon for Site Center
    const siteIcon = L.divIcon({
      className: 'custom-site-marker',
      html: `
        <div style="background: linear-gradient(135deg, #0284c7, #38bdf8); width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.5); color: white; font-weight: bold; font-size: 14px;">
          ⚡
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const previewIcon = L.divIcon({
      className: 'preview-site-marker',
      html: `
        <div style="background: linear-gradient(135deg, #f59e0b, #fbbf24); width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px #f59e0b; color: white; font-size: 16px;">
          📍
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    // Render registered sites with geofence circles
    sites.forEach((site) => {
      const isSelected = selectedSite && selectedSite.id === site.id;
      const marker = L.marker([site.latitude, site.longitude], { icon: siteIcon });
      marker.bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: Cairo, sans-serif; font-size: 13px;">
          <b style="color: #0284c7; font-size: 14px;">${site.name}</b><br/>
          <span>الكود: ${site.code}</span><br/>
          <span>نطاق السياج: ${site.radius_meters} متر</span><br/>
          <span>الدوام: ${site.shift_start} - ${site.shift_end}</span><br/>
          <span style="color: #10b981; font-weight: bold;">المتواجدون الآن: ${site.present_now || 0} فني</span>
        </div>
      `);
      group.addLayer(marker);

      // Geofence Circle
      const circle = L.circle([site.latitude, site.longitude], {
        radius: site.radius_meters,
        color: isSelected ? '#38bdf8' : '#0ea5e9',
        fillColor: isSelected ? '#38bdf8' : '#0284c7',
        fillOpacity: isSelected ? 0.25 : 0.15,
        weight: isSelected ? 3 : 2,
        dashArray: isSelected ? '6, 6' : null
      });
      group.addLayer(circle);
    });

    // Render preview site if user is adding/clicking a new position
    if (previewCoordinates) {
      const pMarker = L.marker([previewCoordinates.lat, previewCoordinates.lon], { icon: previewIcon });
      pMarker.bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: Cairo, sans-serif; font-size: 13px;">
          <b style="color: #f59e0b;">موقع العمل الجديد المقترح</b><br/>
          <span>نصف القطر المحدد: ${previewRadius} متر</span>
        </div>
      `);
      group.addLayer(pMarker);

      const pCircle = L.circle([previewCoordinates.lat, previewCoordinates.lon], {
        radius: previewRadius,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.22,
        weight: 3,
        dashArray: '5, 8'
      });
      group.addLayer(pCircle);

      // Pan to preview coordinate smoothly
      mapInstanceRef.current.panTo([previewCoordinates.lat, previewCoordinates.lon]);
    }

    // Render active field workers
    activeWorkers.forEach((worker) => {
      const isOutside = worker.is_outside;
      const workerIcon = L.divIcon({
        className: 'worker-marker',
        html: `
          <div style="background: ${isOutside ? '#ef4444' : '#10b981'}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${isOutside ? '#ef4444' : '#10b981'}; color: white; font-size: 12px;">
            👤
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      if (worker.lat && worker.lon) {
        const wMarker = L.marker([worker.lat, worker.lon], { icon: workerIcon });
        wMarker.bindPopup(`
          <div style="direction: rtl; text-align: right; font-family: Cairo, sans-serif; font-size: 13px;">
            <b>${worker.name}</b><br/>
            <span style="color: ${isOutside ? '#ef4444' : '#10b981'}; font-weight: bold;">
              ${isOutside ? '⚠️ خارج نطاق الموقع أثناء الدوام' : '✅ متواجد داخل الموقع'}
            </span>
          </div>
        `);
        group.addLayer(wMarker);
      }
    });
  }, [sites, selectedSite, previewCoordinates, previewRadius, activeWorkers]);

  return (
    <div style={{ width: '100%', height, position: 'relative', borderRadius: '14px', overflow: 'hidden' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '8px 14px',
          borderRadius: '10px',
          fontSize: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'none'
        }}
      >
        💡 انقر على الخريطة لتحديد إحداثيات الموقع وتعديل النطاق
      </div>
    </div>
  );
}
