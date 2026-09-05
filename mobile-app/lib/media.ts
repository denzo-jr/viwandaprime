const MACHINE_PHOTOS = [
  "/images/machinery/machine-1.jpg",
  "/images/machinery/machine-2.jpg",
  "/images/machinery/machine-3.jpg",
  "/images/machinery/machine-4.jpg",
  "/images/machinery/machine-5.jpg",
  "/images/machinery/machine-6.jpg",
] as const;

const FUNDI_PHOTOS = [
  "/images/technicians/fundi-1.jpg",
  "/images/technicians/fundi-2.jpg",
  "/images/technicians/fundi-3.jpg",
  "/images/technicians/fundi-4.jpg",
  "/images/technicians/fundi-5.jpg",
] as const;

function stableIndex(value: string, length: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

export function machinePhoto(name: string, category = "") {
  const value = `${name} ${category}`.toLowerCase();
  if (value.includes("weld")) return MACHINE_PHOTOS[4];
  if (value.includes("electric") || value.includes("generator")) return MACHINE_PHOTOS[2];
  if (value.includes("factory") || value.includes("pack")) return MACHINE_PHOTOS[5];
  if (value.includes("press") || value.includes("mill") || value.includes("cnc")) return MACHINE_PHOTOS[3];
  if (value.includes("pump") || value.includes("compress") || value.includes("boiler")) return MACHINE_PHOTOS[0];
  return MACHINE_PHOTOS[stableIndex(value, MACHINE_PHOTOS.length)];
}

export function technicianPhoto(name: string) {
  // Keep the seeded female technician represented consistently.
  if (/grace|rehema|mariam|halima|anna|asha/i.test(name)) return FUNDI_PHOTOS[3];
  return FUNDI_PHOTOS[stableIndex(name, 3)];
}
