/**
 * ProjectLocationModal.tsx
 * Allows selecting Indian states and IMD meteorological stations
 * to auto-populate basic wind speed, seismic zone, and design temperatures.
 * Styled with pure Tailwind CSS.
 */

import React, { useState, useEffect } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import {
  fetchLocationStates,
  fetchLocationStations,
  fetchLocationDetails,
} from '../../services/api';
import { LocationData } from '../../types/location';
import { MapPin, Wind, Activity, Thermometer, Check, X } from 'lucide-react';

export const ProjectLocationModal: React.FC = () => {
  const isLocationModalOpen = useBridgeStore((s) => s.isLocationModalOpen);
  const setLocationModalOpen = useBridgeStore((s) => s.setLocationModalOpen);
  const setLocation = useBridgeStore((s) => s.setLocation);
  const location = useBridgeStore((s) => s.location);
  const constants = useBridgeStore((s) => s.constants);
  const updateField = useBridgeStore((s) => s.updateField);
  const updateAdditionalInput = useBridgeStore((s) => s.updateAdditionalInput);

  const [states, setStates] = useState<string[]>([]);
  const [stations, setStations] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [locationDetails, setLocationDetails] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
  }, [isLocationModalOpen, selectedState]);

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
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedState, selectedStation]);

  // Sync state if modal opens with existing location
  useEffect(() => {
    if (isLocationModalOpen && location) {
      setSelectedState(location.state);
      setSelectedStation(location.station);
      setLocationDetails(location);
    }
  }, [isLocationModalOpen, location]);

  if (!isLocationModalOpen) return null;

  const handleApply = () => {
    if (!locationDetails) return;
    setLocation(locationDetails);

    // Apply to Main Dock inputs
    if (constants) {
      if (constants.KEY_PROJECT_LOCATION) {
        updateField(String(constants.KEY_PROJECT_LOCATION), `${locationDetails.station}, ${locationDetails.state}`);
      }
      if (constants.KEY_BASIC_WIND_SPEED) {
        updateField(String(constants.KEY_BASIC_WIND_SPEED), locationDetails.basic_wind_speed);
      }
      if (constants.KEY_SEISMIC_ZONE) {
        updateField(String(constants.KEY_SEISMIC_ZONE), locationDetails.seismic_zone);
      }
      if (constants.KEY_MAX_TEMP) {
        updateField(String(constants.KEY_MAX_TEMP), locationDetails.max_temperature);
      }
      if (constants.KEY_MIN_TEMP) {
        updateField(String(constants.KEY_MIN_TEMP), locationDetails.min_temperature);
      }
    } else {
      updateField('project.location', `${locationDetails.station}, ${locationDetails.state}`);
      updateField('loading.wind_load.basic_wind_speed', locationDetails.basic_wind_speed);
      updateField('loading.seismic_load.seismic_zone', locationDetails.seismic_zone);
      updateField('loading.temperature_load.highest_max_temp', locationDetails.max_temperature);
      updateField('loading.temperature_load.lowest_min_temp', locationDetails.min_temperature);
    }

    // Apply to Additional Inputs sub-tabs
    updateAdditionalInput('loading.wind_load.basic_wind_speed', String(locationDetails.basic_wind_speed));
    updateAdditionalInput('loading.seismic_load.seismic_zone', String(locationDetails.seismic_zone));
    updateAdditionalInput('loading.temperature_load.highest_max_temp', String(locationDetails.max_temperature));
    updateAdditionalInput('loading.temperature_load.lowest_min_temp', String(locationDetails.min_temperature));

    setLocationModalOpen(false);
  };

  const handleClose = () => {
    setLocationModalOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-dialog-title"
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[1000]"
    >
      <div className="bg-white rounded-lg w-[540px] shadow-lg overflow-hidden border border-[#e0e0e0] flex flex-col font-sans">
        {/* Header */}
        <div className="p-[14px_18px] bg-[#f4f4f4] border-b border-[#e0e0e0] flex justify-between items-center select-none">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-[#90af13]" aria-hidden="true" />
            <h3 id="location-dialog-title" className="text-sm font-semibold text-black">
              Project Location &amp; Weather Details
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="bg-transparent border-0 cursor-pointer text-[#666666] hover:text-black p-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label
                htmlFor="location-state-select"
                className="block text-[11px] font-semibold text-[#666666] mb-1.5"
              >
                State
              </label>
              <select
                id="location-state-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full p-2 rounded border border-[#d0d0d0] text-xs bg-white text-black outline-none focus:border-[#90af13] cursor-pointer"
              >
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="location-station-select"
                className="block text-[11px] font-semibold text-[#666666] mb-1.5"
              >
                District / Station
              </label>
              <select
                id="location-station-select"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full p-2 rounded border border-[#d0d0d0] text-xs bg-white text-black outline-none focus:border-[#90af13] cursor-pointer"
              >
                {stations.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Environmental Parameters Card */}
          <div className="bg-[#f4f4f4] border border-[#e0e0e0] rounded-[6px] p-4">
            <h4 className="text-[11px] uppercase tracking-[0.05em] text-[#666666] font-bold mb-3">
              IRC:6 Environmental Constraints
            </h4>

            {loading ? (
              <div className="text-xs text-[#666666]">Loading location data...</div>
            ) : locationDetails ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <Wind size={20} className="text-[#0284c7] shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-[11px] text-[#666666]">Basic Wind Speed (V_b)</div>
                    <div className="text-[13px] font-semibold font-mono text-black">
                      {locationDetails.basic_wind_speed} m/s
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Activity size={20} className="text-[#dc2626] shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-[11px] text-[#666666]">Seismic Zone</div>
                    <div className="text-[13px] font-semibold text-black">
                      {locationDetails.seismic_zone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Thermometer size={20} className="text-[#ea580c] shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-[11px] text-[#666666]">Max Temperature</div>
                    <div className="text-[13px] font-semibold font-mono text-black">
                      {locationDetails.max_temperature} °C
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Thermometer size={20} className="text-[#0d9488] shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-[11px] text-[#666666]">Min Temperature</div>
                    <div className="text-[13px] font-semibold font-mono text-black">
                      {locationDetails.min_temperature} °C
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#666666]">No location details available</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-[12px_18px] bg-[#f4f4f4] border-t border-[#e0e0e0] flex justify-end gap-2 select-none">
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-1.5 rounded border border-[#d0d0d0] bg-white text-black hover:bg-[#f0f0f0] cursor-pointer text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 rounded border-0 bg-[#90af13] hover:bg-[#7a9a12] text-white font-semibold cursor-pointer text-xs flex items-center gap-1.5 transition-colors"
          >
            <Check size={14} aria-hidden="true" /> Apply Location
          </button>
        </div>
      </div>
    </div>
  );
};
