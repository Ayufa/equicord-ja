/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";

import { getExcludedLanguages, settings } from "../settings";
import { CachedTranslation, TranslateResponse } from "../types";

const logger = new Logger("MessageTranslate");

const translationCache = new Map<string, CachedTranslation>();
const inProgress = new Set<string>();
const failed = new Map<string, string>();

export function getCached(messageId: string): CachedTranslation | undefined {
    return translationCache.get(messageId);
}

export function hasFailed(messageId: string, text: string): boolean {
    return failed.get(messageId) === text;
}

export function isInProgress(messageId: string): boolean {
    return inProgress.has(messageId);
}

export function clearCache(messageId: string) {
    translationCache.delete(messageId);
    failed.delete(messageId);
}

interface GooglePaResponse {
    translation?: string;
    sourceLanguage?: string;
    detectedLanguages?: {
        srclangs?: string[];
        srclangsConfidences?: number[];
    };
}

// [equicord-ja] Use the translate-pa endpoint (same as the built-in Translate plugin).
// The legacy gtx endpoint rate-limits (HTTP 429) under auto-translate traffic,
// which silently disabled all translations. Kept below only as a fallback.
async function fetchTranslationPa(text: string, targetLang: string): Promise<TranslateResponse> {
    const url = "https://translate-pa.googleapis.com/v1/translate?" + new URLSearchParams({
        "params.client": "gtx",
        "dataTypes": "TRANSLATION",
        "key": "AIzaSyDLEeFI5OtFBwYBIoK_jj5m32rZK5CkCXA", // some google API key
        "query.sourceLanguage": "auto",
        "query.targetLanguage": targetLang,
        "query.text": text,
    });

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Translation API returned ${response.status} ${response.statusText}`);
    }

    const data: GooglePaResponse = await response.json();
    return {
        src: data.sourceLanguage ?? data.detectedLanguages?.srclangs?.[0] ?? "",
        confidence: data.detectedLanguages?.srclangsConfidences?.[0] ?? 1,
        sentences: [{ trans: data.translation }],
    };
}

async function fetchTranslationLegacy(text: string, targetLang: string): Promise<TranslateResponse> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&dj=1&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Translation API returned ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

async function fetchTranslation(text: string, targetLang: string): Promise<TranslateResponse> {
    try {
        return await fetchTranslationPa(text, targetLang);
    } catch {
        return fetchTranslationLegacy(text, targetLang);
    }
}

export async function translate(messageId: string, text: string): Promise<CachedTranslation | null> {
    if (inProgress.has(messageId)) return null;
    if (translationCache.has(messageId)) return translationCache.get(messageId)!;

    inProgress.add(messageId);

    try {
        const targetLang = settings.store.targetLanguage.trim().toLowerCase();
        const response = await fetchTranslation(text, targetLang);
        const sourceLang = response.src.trim().toLowerCase();

        if (sourceLang === targetLang || response.confidence < settings.store.confidenceRequirement || getExcludedLanguages().has(sourceLang)) {
            failed.set(messageId, text);
            return null;
        }

        const translatedText = response.sentences.map(s => s.trans).filter(Boolean).join("");
        if (!translatedText || translatedText === text) {
            failed.set(messageId, text);
            return null;
        }

        const entry: CachedTranslation = {
            original: text,
            translated: translatedText,
            sourceLang: response.src,
        };
        translationCache.set(messageId, entry);
        return entry;
    } catch (e) {
        logger.error("Translation failed", e);
        failed.set(messageId, text);
        return null;
    } finally {
        inProgress.delete(messageId);
    }
}
