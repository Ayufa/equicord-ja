/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DeleteIcon, SearchIcon } from "@components/Icons";
import { classNameFactory } from "@utils/css";
import { React, useCallback, useEffect, useRef, useState } from "@webpack/common";

import { Entry, getFile, Group, Kind } from "../library";

export const cl = classNameFactory("vc-bie-");

const SQUARE = new Set(["AVATAR", "AVATAR_DECORATION", "GUILD_ICON", "PERSONAL_WIDGET_FIELD"]);

const KIND_NAMES: Record<string, string> = {
    AVATAR: "アバター",
    BANNER: "バナー",
    GUILD_ICON: "サーバーアイコン",
    GUILD_BANNER: "サーバーバナー",
    SCHEDULED_EVENT_IMAGE: "イベントカバー",
    HOME_HEADER: "ホームヘッダー",
    AVATAR_DECORATION: "デコレーション",
    PERSONAL_WIDGET_COVER: "ウィジェットカバー",
    PERSONAL_WIDGET_FIELD: "ウィジェット画像"
};

const kindName = (kind: Kind) => KIND_NAMES[kind] ?? kind.toLowerCase().replace(/_/g, " ");

const isAnimated = (entry: Entry) => entry.type === "image/gif" || entry.name.toLowerCase().endsWith(".gif");
export const croppedLabel = (kind: Kind) => `${kindName(kind)}（切り抜き済み）`;

const PinIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
        <path d="M15 4V9l3 3v2h-5v7l-1 1-1-1v-7H6v-2l3-3V4H8V2h8v2z" />
    </svg>
);

export function Shelf({ kind, group, entries, thumbs, activeId, wornId, onGroup, onPick, onPin, onForget, onPutBack }: {
    kind: Kind;
    group: Group;
    entries: Entry[];
    thumbs: Record<string, string>;
    activeId: string | null;
    wornId: string | null;
    onGroup(group: Group): void;
    onPick(entry: Entry): void;
    onPin(entry: Entry): void;
    onForget(entry: Entry, immediate: boolean): void;
    onPutBack?(): void;
}) {
    const shape = SQUARE.has(kind) ? "square" : "wide";

    const [hovered, setHovered] = useState<string | null>(null);
    const [filter, setFilter] = useState("");
    const [playing, setPlaying] = useState<Record<string, string>>({});
    const played = useRef<string[]>([]);
    const live = useRef(true);

    useEffect(() => () => {
        live.current = false;
        played.current.forEach(URL.revokeObjectURL);
    }, []);

    const play = useCallback(async (entry: Entry) => {
        setHovered(entry.id);
        if (!isAnimated(entry) || playing[entry.id]) return;

        const blob = await getFile(entry.id);
        if (!blob || !live.current) return;

        const url = URL.createObjectURL(blob);
        played.current.push(url);
        setPlaying(current => ({ ...current, [entry.id]: url }));
    }, [playing]);

    const wanted = filter.trim().toLowerCase();
    const shown = wanted ? entries.filter(entry => entry.name.toLowerCase().includes(wanted)) : entries;

    return (
        <div className={cl("panel", shape)}>
            <div className={cl("tabs")} role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={group === "original"}
                    className={cl("tab", { on: group === "original" })}
                    onClick={() => onGroup("original")}
                >オリジナル</button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={group === "cropped"}
                    className={cl("tab", { on: group === "cropped" })}
                    onClick={() => onGroup("cropped")}
                >{croppedLabel(kind)}</button>

                {onPutBack && (
                    <button type="button" className={cl("action")} onClick={onPutBack}>
                        最後のものを戻す
                    </button>
                )}

            </div>

            <div className={cl("bar")}>
                <span className={cl("count")}>
                    {wanted ? `${entries.length} 件中 ${shown.length} 件` : `${entries.length} 件を保持中`}
                </span>
                {entries.length > 12 && (
                    <div className={cl("find")}>
                        <SearchIcon width={12} height={12} aria-hidden />
                        <input
                            type="text"
                            value={filter}
                            placeholder="検索"
                            aria-label="保存した画像を検索"
                            onChange={event => setFilter(event.currentTarget.value)}
                        />
                        {filter && (
                            <button
                                type="button"
                                aria-label="検索をクリア"
                                onClick={() => setFilter("")}
                            >&times;</button>
                        )}
                    </div>
                )}
            </div>

            <div className={cl("strip")} role="group" aria-label="保存した画像">
                {shown.map(entry => {
                    const picture = (hovered === entry.id && playing[entry.id]) || thumbs[entry.id];

                    return <div
                        key={entry.id}
                        className={cl("item", { pinned: entry.pinned, worn: entry.id === wornId })}
                        onMouseEnter={() => play(entry)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <button
                            type="button"
                            aria-label={entry.name}
                            title={entry.id === wornId ? `${entry.name}
現在使用中です` : entry.name}
                            className={cl("thumb", { active: activeId === entry.id })}
                            style={picture ? { backgroundImage: `url(${picture})` } : undefined}
                            onClick={() => onPick(entry)}
                            onContextMenu={event => {
                                event.preventDefault();
                                onForget(entry, event.shiftKey);
                            }}
                        />
                        <button
                            type="button"
                            className={cl("remove")}
                            aria-label={`${entry.name} を削除`}
                            title="削除。Shift を押しながらだと確認を省略します"
                            onClick={event => onForget(entry, event.shiftKey)}
                        >
                            <DeleteIcon width={10} height={10} />
                        </button>
                        <button
                            type="button"
                            aria-pressed={!!entry.pinned}
                            className={cl("pin", { on: entry.pinned })}
                            aria-label={entry.pinned ? `${entry.name} のピンを外す` : `${entry.name} をピン留め`}
                            title={entry.pinned ? "ピン留め済み。棚から落ちることはありません" : "ピン留めすると棚から落ちなくなります"}
                            onClick={() => onPin(entry)}
                        >
                            <PinIcon width={10} height={10} />
                        </button>
                    </div>;
                })}

                {!shown.length && (
                    <span className={cl("empty")}>
                        {entries.length
                            ? "条件に一致するものはありません"
                            : group === "original"
                                ? "選んだり、貼ったり、ドロップした画像はここに入ります"
                                : "切り抜いた画像はここに入ります"}
                    </span>
                )}
            </div>
        </div>
    );
}
