/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { fetchBuffer, fetchJson } from "@main/utils/http";
import { VENCORD_USER_AGENT } from "@shared/vencordUserAgent";
import { writeFileSync } from "original-fs";

import gitHash from "~git-hash";
import gitRemote from "~git-remote";

import { Updater } from ".";
import { ASAR_FILE } from "./common";

const API_BASE = `https://api.github.com/repos/${gitRemote}`;
let PendingUpdate: string | null = null;

async function githubGet<T = any>(endpoint: string) {
    return fetchJson<T>(API_BASE + endpoint, {
        headers: {
            Accept: "application/vnd.github+json",
            // "All API requests MUST include a valid User-Agent header.
            // Requests with no User-Agent header will be rejected."
            "User-Agent": VENCORD_USER_AGENT
        }
    });
}

async function listUpdates() {
    const isOutdated = await fetchUpdate();
    if (!isOutdated) return [];

    const data = await githubGet(`/compare/${gitHash}...HEAD`);

    return data.commits.map((c: any) => ({
        hash: c.sha,
        author: c.author?.login ?? c.commit?.author?.name ?? "Unknown Author",
        message: c.commit.message.split("\n")[0]
    }));
}

// [equicord-ja] 適用済みの変更履歴用に、現在のビルドまでの直近コミットを取得する。
// REST API は未認証だとレート制限（60回/時・IP単位）が厳しく履歴表示が失敗するため、
// 主にコミット一覧の Atom フィードを使い、失敗時だけ REST API にフォールバックする。
function decodeXmlEntities(s: string) {
    return s
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
}

async function listHistory() {
    try {
        const buf = await fetchBuffer(`https://github.com/${gitRemote}/commits/main.atom`);
        const xml = Buffer.isBuffer(buf) ? buf.toString("utf-8") : new TextDecoder().decode(buf);

        const entries: { hash: string; author: string; message: string; }[] = [];
        for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
            const block = m[1];
            const sha = block.match(/Commit\/([0-9a-f]{40})/)?.[1];
            const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.trim();
            if (!sha || !title) continue;
            const authorName = block.match(/<author>\s*<name>([\s\S]*?)<\/name>/)?.[1]?.trim();
            const authorEmail = block.match(/<author>[\s\S]*?<email>([\s\S]*?)<\/email>/)?.[1]?.trim();
            const author = authorName || (authorEmail ? authorEmail.split("@")[0] : undefined);
            entries.push({
                hash: sha,
                author: decodeXmlEntities(author || "Unknown Author"),
                message: decodeXmlEntities(title).split("\n")[0]
            });
            if (entries.length >= 20) break;
        }

        if (entries.length) {
            // 現在のビルドより新しいコミットは履歴に含めない
            // （フィードは新しい順なので、自分のビルドの位置から後ろが履歴になる）
            const idx = entries.findIndex(e => gitHash.startsWith(e.hash) || e.hash.startsWith(gitHash));
            return idx >= 0 ? entries.slice(idx, idx + 15) : entries.slice(0, 15);
        }
    } catch { /* REST API へフォールバック */ }

    const data = await githubGet(`/commits?sha=${gitHash}&per_page=15`);
    return data.map((c: any) => ({
        hash: c.sha,
        author: c.author?.login ?? c.commit?.author?.name ?? "Unknown Author",
        message: c.commit.message.split("\n")[0]
    }));
}

async function fetchUpdate() {
    const data = await githubGet("/releases/latest");

    const hash = data.name.slice(data.name.lastIndexOf(" ") + 1);
    // [equicord-ja] リリースタイトルには短縮ハッシュを載せるため、前方一致でも最新とみなす
    if (hash === gitHash || gitHash.startsWith(hash))
        return false;

    const asset = data.assets.find(a => a.name === ASAR_FILE);
    PendingUpdate = asset.browser_download_url;

    return true;
}

async function applyUpdate() {
    if (!PendingUpdate) return true;

    const data = await fetchBuffer(PendingUpdate);
    writeFileSync(__dirname, data, { flush: true });

    PendingUpdate = null;

    return true;
}

const HttpUpdater: Updater = {
    getRepo: async () => `https://github.com/${gitRemote}`,
    listUpdates,
    listHistory,
    fetchUpdate,
    applyUpdate
};

export default HttpUpdater;
