import { useMemo } from "react";
import Select from "react-select";
import {
  getMunicipalitiesByProvince,
  getBarangaysByMunicipality,
} from "@aivangogh/ph-address";

import { getSelectProps } from "../select/selectConfig";
import { FormLabel, FormInput } from "./FormField";

import { COUNTRY_OPTIONS } from "../../constants/options";
import {
  PHILIPPINES,
  ALL_PROVINCE_OPTIONS,
  toOption,
} from "../../constants/phAddress";

export default function PhAddressFields({
  formData,
  addressCodes,
  onAddressSelect,
  onChange,
  disabled = false,
}) {
  const isPhilippines = formData.country === PHILIPPINES;

  // ── Cascading options ─
  const municipalityOptions = useMemo(() => {
    if (!addressCodes.provinceCode || addressCodes.isNCRCity) return [];
    return getMunicipalitiesByProvince(addressCodes.provinceCode).map(toOption);
  }, [addressCodes.provinceCode, addressCodes.isNCRCity]);

  const barangayOptions = useMemo(() => {
    if (!addressCodes.municipalityCode) return [];
    return getBarangaysByMunicipality(addressCodes.municipalityCode).map(toOption);
  }, [addressCodes.municipalityCode]);

  // ── Controlled values ────
  const currentCountry = COUNTRY_OPTIONS.find((o) => o.value === formData.country) || null;
  const currentProvince = ALL_PROVINCE_OPTIONS.find((o) => o.value === addressCodes.provinceCode) || null;
  const currentCity = municipalityOptions.find((o) => o.value === addressCodes.municipalityCode) || null;
  const currentBarangay = barangayOptions.find((o) => o.label === formData.barangay) || null;

  // ── Handlers ───
  const handleCountryChange = (opt) => {
    const newCountry = opt?.value ?? "";
    if (newCountry === formData.country) return;
    onAddressSelect(
      { country: newCountry, province: "", city: "", barangay: "" },
      { provinceCode: "", municipalityCode: "", isNCRCity: false },
    );
  };

  const handleProvinceChange = (opt) => {
    if (!opt) {
      onAddressSelect(
        { province: "", city: "", barangay: "" },
        { provinceCode: "", municipalityCode: "", isNCRCity: false },
      );
      return;
    }

    if (opt.isNCRCity) {
      // NCR city serves as both province and city
      onAddressSelect(
        { province: opt.label, city: opt.label, barangay: "" },
        { provinceCode: opt.value, municipalityCode: opt.value, isNCRCity: true },
      );
    } else {
      onAddressSelect(
        { province: opt.label, city: "", barangay: "" },
        { provinceCode: opt.value, municipalityCode: "", isNCRCity: false },
      );
    }
  };

  const handleCityChange = (opt) => {
    onAddressSelect(
      { city: opt?.label ?? "", barangay: "" },
      { municipalityCode: opt?.value ?? "" },
    );
  };

  const handleBarangayChange = (opt) => {
    onAddressSelect({ barangay: opt?.label ?? "" });
  };

  // ── Render ──
  return (
    <div className="space-y-4">
      {/* Country */}
      <div>
        <FormLabel required>Country</FormLabel>
        <Select
          {...getSelectProps()}
          options={COUNTRY_OPTIONS}
          value={currentCountry}
          onChange={handleCountryChange}
          isDisabled={disabled}
          placeholder="Select country"
        />
      </div>


      {isPhilippines && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel required>Province</FormLabel>
              <Select
                {...getSelectProps()}
                options={ALL_PROVINCE_OPTIONS}
                value={currentProvince}
                onChange={handleProvinceChange}
                isDisabled={disabled}
                placeholder="Select province"
                isClearable
              />
            </div>

            {!addressCodes.isNCRCity && (
              <div>
                <FormLabel required>City / Municipality</FormLabel>
                <Select
                  {...getSelectProps()}
                  options={municipalityOptions}
                  value={currentCity}
                  onChange={handleCityChange}
                  isDisabled={disabled || municipalityOptions.length === 0}
                  placeholder={
                    municipalityOptions.length === 0
                      ? "Select a province first"
                      : "Select city/municipality"
                  }
                  isClearable
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel>Barangay</FormLabel>
              <Select
                {...getSelectProps()}
                options={barangayOptions}
                value={currentBarangay}
                onChange={handleBarangayChange}
                isDisabled={disabled || barangayOptions.length === 0}
                placeholder={
                  barangayOptions.length === 0
                    ? "Select a city first"
                    : "Select barangay"
                }
                isClearable
              />
            </div>

            <div>
              <FormLabel required>Zip Code</FormLabel>
              <FormInput
                name="zipCode"
                value={formData.zipCode || ""}
                onChange={onChange}
                disabled={disabled}
                placeholder="e.g. 4400"
                required
              />
            </div>
          </div>
        </>
      )}

      {!isPhilippines && (
        <div>
          <FormLabel required>Zip Code</FormLabel>
          <FormInput
            name="zipCode"
            value={formData.zipCode || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Enter postal / zip code"
            required
          />
        </div>
      )}
    </div>
  );
}