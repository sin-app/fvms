"use server";

import { getVisitDetail, getVisitTimeline } from "../services/visit-service";

export async function fetchVisitDetail(id: string) {
  return getVisitDetail(id);
}

export async function fetchVisitTimeline(scheduleId: string) {
  return getVisitTimeline(scheduleId);
}
