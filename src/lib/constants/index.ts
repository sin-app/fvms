export const APP_NAME = "FVMS";
export const APP_TITLE = "Field Visit Management System";

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 25, 50, 100],
} as const;

export const FILE = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024,
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ACCEPTED_EXCEL_TYPES: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
} as const;

export const GPS = {
  MAX_ACCURACY: 100,
  TIMEOUT: 10000,
} as const;

export const STORAGE = {
  PHOTOS_BUCKET: "visit-photos",
  MAX_FILES_PER_VISIT: 10,
} as const;
