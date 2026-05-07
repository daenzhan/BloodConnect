"use client"

import dynamic from "next/dynamic"

const LocationPickerClient = dynamic(
    () => import("./location-picker").then((mod) => mod.LocationPicker),
    { ssr: false }
)
export { LocationPickerClient }