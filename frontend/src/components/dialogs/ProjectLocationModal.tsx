/**
 * ProjectLocationModal.tsx
 *
 * Dialog for selecting project state/station and viewing environmental parameters
 * (IRC:6 Basic Wind Speed, Seismic Zone, Max/Min Temperatures).
 * Adapts osdagbridge.desktop.ui.dialogs.project_location.ProjectLocationDialog.
 *
 * Validation mirrors desktop validate_and_save (project_location.py lines 669-693):
 *   - Verifies wind speed, seismic zone, and temperatures are populated.
 *   - Updates the store location state and closes the dialog upon confirmation.
 */

import React, { useEffect, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import {
  fetchLocationStates,
  fetchLocationStations,
  fetchLocationDetails,
} from '../../services/api';
import { LocationData } from '../../types/location';
import { X, MapPin, Check, Wind, Activity, Thermometer } from 'lucide-react';

export const ProjectLocationModal: React.FC = () => {
  // ── Store Selectors ────────────────────────────────────────────────────────
  const isLocationModalOpen = useBridgeStore((s) => s.isLocationModalOpen);
  const setLocationModalOpen = useBridgeStore((s) => s.setLocationModalOpen);
  const setLocation = useBridgeStore((s) => s.setLocation);

  // ── Local State ────────────────────────────────────────────────────────────
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [stations, setStations] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [locationDetails, setLocationDetails] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Fetch states list when dialog opens
  useEffect(() => {
    if (!isLocationModalOpen) return;

    let cancelled = false;
    fetchLocationStates().then((stateList) => {
      if (cancelled) return;
      setStates(stateList);
      if (stateList.length > 0 && !selectedState) {
        setSelectedState(stateList[0]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLocationModalOpen]);

  // Fetch stations when selected state changes
  useEffect(() => {
    if (!selectedState) return;

    let cancelled = false;
    fetchLocationStations(selectedState).then((stationList) => {
      if (cancelled) return;
      setStations(stationList);
      if (stationList.length > 0) {
        setSelectedStation(stationList[0]);
      } else {
        setSelectedStation('');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedState]);

  // Fetch location details when station changes
  useEffect(() => {
    if (!selectedState || !selectedStation) return;

    let cancelled = false;
    setLoading(true);
    fetchLocationDetails(selectedState, selectedStation)
      .then((details) => {
        if (cancelled) return;
        setLocationDetails(details);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedState, selectedStation]);

  if (!isLocationModalOpen) return null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  /**
   * Validates environmental data completeness before saving.
   * Mirrors desktop validate_and_save (project_location.py lines 669-693).
   */
  const handleApply = () => {
    if (!locationDetails) {
      window.alert('Incomplete Data: Please select a location either on the map or from the dropdown menu.');
      return;
    }

    const missing: string[] = [];
    if (!locationDetails.basic_wind_speed && locationDetails.basic_wind_speed !== 0) {
      missing.push('Wind Speed');
    }
    if (!locationDetails.seismic_zone) {
      missing.push('Seismic Zone');
    }
    if (locationDetails.max_temperature === undefined || locationDetails.min_temperature === undefined) {
      missing.push('Temperature');
    }

    if (missing.length > 0) {
      window.alert(
        `Incomplete Data: Missing data: ${missing.join(', ')}.\nPlease select a different location or enter values manually.`
      );
      return;
    }

    setLocation(locationDetails);
    setLocationModalOpen(false);
  };

  const handleClose = () => {
    setLocationModalOpen(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-bg)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="modal-card"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '8px',
          width: '540px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            background: 'var(--bg-grouped)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="var(--accent-osdag)" aria-hidden="true" />
            <h3 id="location-dialog-title" style={{ fontSize: '14px', fontWeight: 600 }}>
              Project Location &amp; Weather Details
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label
                htmlFor="location-state-select"
                style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
              >
                State
              </label>
              <select
                id="location-state-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                }}
              >
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="location-station-select"
                style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}
              >
                District / Station
              </label>
              <select
                id="location-station-select"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                }}
              >
                {stations.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Environmental Parameters Card */}
          <div
            style={{
              background: 'var(--bg-grouped)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '16px',
            }}
          >
            <h4
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              IRC:6 Environmental Constraints
            </h4>

            {loading ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading location data...</div>
            ) : locationDetails ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Wind size={20} color="#0284c7" aria-hidden="true" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Basic Wind Speed (V_b)</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {locationDetails.basic_wind_speed} m/s
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Activity size={20} color="#dc2626" aria-hidden="true" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Seismic Zone</div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                      {locationDetails.seismic_zone}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Thermometer size={20} color="#ea580c" aria-hidden="true" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Temperature</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {locationDetails.max_temperature} °C
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Thermometer size={20} color="#0d9488" aria-hidden="true" />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min Temperature</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {locationDetails.min_temperature} °C
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No location details available</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 18px',
            background: 'var(--bg-grouped)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            style={{
              padding: '6px 18px',
              borderRadius: '4px',
              border: 'none',
              background: 'var(--accent-osdag)',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} aria-hidden="true" /> Apply Location
          </button>
        </div>
      </div>
    </div>
  );
};
