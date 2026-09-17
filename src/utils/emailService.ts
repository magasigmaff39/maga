// Email + OTP helpers — thin wrappers over the typed API client (kept for the existing modal components).
import type { University, RoadmapStep } from '../types';
import { authApi, mailApi, ApiError } from '../lib/api';

export interface SendEmailPayload {
  toEmail: string;
  studentName: string;
  readinessScore: number;
  roadmap: RoadmapStep[];
  matchedUnis: University[];
}

export interface SendEmailResponse {
  success: boolean;
  delivered: boolean;
  service?: string;
  recipient: string;
  messageId?: string;
  note?: string;
  error?: string;
}

export async function sendRoadmapEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
  try {
    const res = await mailApi.sendPlan(payload);
    return { ...res, recipient: payload.toEmail };
  } catch (err) {
    // No silent "success" any more — the UI tells the truth about delivery.
    const message = err instanceof ApiError ? err.message : 'Ошибка соединения с сервером';
    return { success: false, delivered: false, recipient: payload.toEmail, error: message };
  }
}

export interface SendOtpResponse {
  success: boolean;
  delivered: boolean;
  message: string;
  devCode?: string;
  ttlMinutes?: number;
  error?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified?: boolean;
  error?: string;
}

export const sendVerificationOtp = (email: string, name?: string): Promise<SendOtpResponse> => authApi.sendOtp(email, name);
export const verifyOtpCode = (email: string, code: string): Promise<VerifyOtpResponse> => authApi.verifyOtp(email, code);
