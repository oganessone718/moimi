"use server";

import { getDb } from "@/lib/db";
import {
  createMeeting,
  type CreateMeetingInput,
  type CreateMeetingResult,
} from "./createMeeting";
import {
  submitResponse,
  type SubmitResponseInput,
  type SubmitResponseResult,
} from "./submitResponse";

export async function createMeetingAction(
  input: CreateMeetingInput,
): Promise<CreateMeetingResult> {
  return createMeeting(getDb(), input);
}

export async function submitResponseAction(
  input: SubmitResponseInput,
): Promise<SubmitResponseResult> {
  return submitResponse(getDb(), input);
}
