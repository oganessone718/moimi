"use server";

import { getDb } from "@/lib/db";
import {
  createMeeting,
  type CreateMeetingInput,
  type CreateMeetingResult,
} from "./createMeeting";

export async function createMeetingAction(
  input: CreateMeetingInput,
): Promise<CreateMeetingResult> {
  return createMeeting(getDb(), input);
}
