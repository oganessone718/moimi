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
import {
  confirmMeeting,
  type ConfirmMeetingInput,
  type ConfirmMeetingResult,
} from "./confirmMeeting";

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

export async function confirmMeetingAction(
  input: ConfirmMeetingInput,
): Promise<ConfirmMeetingResult> {
  return confirmMeeting(getDb(), input);
}
