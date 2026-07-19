import { faker } from "@faker-js/faker";
import type {
  User,
  Kabupaten,
  Kecamatan,
  Desa,
  Schedule,
  VisitNotes,
  VisitPhoto,
  Notification,
  ActivityLog,
} from "@/types";

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: faker.helpers.arrayElement(["admin", "qc", "produksi"]),
    avatar_url: null,
    phone: faker.phone.number(),
    is_active: true,
    last_login_at: null,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createKabupaten(overrides: Partial<Kabupaten> = {}): Kabupaten {
  return {
    id: faker.string.uuid(),
    name: faker.location.city(),
    code: faker.string.alphanumeric(4).toUpperCase(),
    is_active: true,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.past().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

export function createKecamatan(overrides: Partial<Kecamatan> = {}): Kecamatan {
  return {
    id: faker.string.uuid(),
    kabupaten_id: faker.string.uuid(),
    name: faker.location.city(),
    code: faker.string.alphanumeric(4).toUpperCase(),
    is_active: true,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.past().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

export function createDesa(overrides: Partial<Desa> = {}): Desa {
  return {
    id: faker.string.uuid(),
    kecamatan_id: faker.string.uuid(),
    name: faker.location.city(),
    code: faker.string.alphanumeric(4).toUpperCase(),
    is_active: true,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.past().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

export function createSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    kabupaten_id: faker.string.uuid(),
    kecamatan_id: faker.string.uuid(),
    desa_id: faker.string.uuid(),
    visit_date: faker.date.future().toISOString().split("T")[0],
    status: faker.helpers.arrayElement(["pending", "on_the_way", "in_progress", "completed", "cancelled"]),
    latitude: null,
    longitude: null,
    accuracy: null,
    visit_time: null,
    notes: null,
    tgl_tanam: null,
    cgr: null,
    cgr_code: null,
    block_no: null,
    no_plot: null,
    member_name: null,
    real_tanam_ha: null,
    gagal_tanam: null,
    sisa_di_lahan_ha: null,
    created_by: faker.string.uuid(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.past().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

export function createVisitNotes(overrides: Partial<VisitNotes> = {}): VisitNotes {
  return {
    id: faker.string.uuid(),
    schedule_id: faker.string.uuid(),
    observation: faker.lorem.paragraph(),
    problem: faker.lorem.sentence(),
    recommend: faker.lorem.sentence(),
    additional: faker.lorem.sentence(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createVisitPhoto(overrides: Partial<VisitPhoto> = {}): VisitPhoto {
  return {
    id: faker.string.uuid(),
    schedule_id: faker.string.uuid(),
    url: faker.image.url(),
    thumbnail: null,
    caption: faker.lorem.sentence(),
    file_size: faker.number.int({ min: 10000, max: 5000000 }),
    mime_type: "image/jpeg",
    created_at: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    message: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement(["info", "warning", "success", "error"]),
    is_read: faker.datatype.boolean(),
    link: null,
    created_at: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createActivityLog(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    action: faker.helpers.arrayElement(["created", "status_changed", "notes_saved", "photo_uploaded"]),
    entity_type: "schedules",
    entity_id: faker.string.uuid(),
    metadata: null,
    ip_address: null,
    user_agent: null,
    created_at: faker.date.past().toISOString(),
    ...overrides,
  };
}
