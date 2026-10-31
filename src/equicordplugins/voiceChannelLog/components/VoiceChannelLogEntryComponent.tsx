/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./VoiceChannelLogEntryComponent.css";

import { openUserProfile } from "@utils/discord";
import { Channel } from "@vencord/discord-types";
import { ApplicationStore, Clickable, closeAllModals,IconUtils, NavigationRouter, Timestamp, Tooltip, UserStore } from "@webpack/common";

import { getCallStartTime } from "../logs";
import { VoiceChannelLogEntry } from "../types";
import { cl, downloadSound, formatElapsedTime, getEmojiUrl, playSound } from "../utils";
import EventIcon from "./VoiceChannelLogEntryIcons";

function getEventDescription(entry: VoiceChannelLogEntry): string {
    switch (entry.type) {
        case "join":
            return "チャンネルに参加しました";
        case "leave":
            return "チャンネルから退出しました";
        case "move":
            if (entry.newChannelId && entry.oldChannelId && entry.channelId === entry.oldChannelId)
                return "別のチャンネルへ移動しました";
            return "別のチャンネルから移動してきました";
        case "soundboard":
            return "";
        case "server_mute":
            return entry.enabled ? "サーバー側でミュートされました" : "サーバーミュートが解除されました";
        case "server_deafen":
            return entry.enabled ? "サーバー側でスピーカーミュートされました" : "サーバースピーカーミュートが解除されました";
        case "self_video":
            return entry.enabled ? "カメラをオンにしました" : "カメラをオフにしました";
        case "self_stream":
            return entry.enabled ? "画面共有を開始しました" : "画面共有を停止しました";
        case "activity":
            return `${entry.activityName ?? "アクティビティ"}を開始しました`;
        case "activity_stop":
            return `${entry.activityName ?? "アクティビティ"}を停止しました`;
    }
}

export function VoiceChannelLogEntryComponent({ logEntry, channel }: { logEntry: VoiceChannelLogEntry; channel: Channel; }) {
    const user = UserStore.getUser(logEntry.userId);
    const username = user?.globalName ?? user?.username ?? "不明";
    const elapsed = formatElapsedTime(getCallStartTime(), logEntry.timestamp);
    const description = getEventDescription(logEntry);

    return (
        <li className={cl("entry")}>
            <div className={cl("entry-timestamp")}>
                <Timestamp className={cl("timestamp")} timestamp={new Date(logEntry.timestamp)} compact isInline={false} cozyAlt />
                {elapsed && <span className={cl("elapsed")}>{elapsed}</span>}
            </div>
            {(logEntry.type === "activity" || logEntry.type === "activity_stop") && logEntry.applicationId ? (
                <img
                    className={cl("app-icon")}
                    src={IconUtils.getApplicationIconURL({ id: logEntry.applicationId, icon: ApplicationStore.getApplication(logEntry.applicationId)?.icon })}
                    alt={logEntry.activityName ?? "アクティビティ"}
                />
            ) : (
                <EventIcon type={logEntry.type} />
            )}
            <Tooltip text={username}>
                {(tooltipProps: any) => (
                    <img
                        {...tooltipProps}
                        className={cl("avatar")}
                        onClick={() => openUserProfile(logEntry.userId)}
                        src={user ? user.getAvatarURL(channel.getGuildId()) : IconUtils.getDefaultAvatarURL(logEntry.userId)}
                        alt={username}
                    />
                )}
            </Tooltip>
            <div className={cl("content")}>
                <span className={cl("username")} onClick={() => openUserProfile(logEntry.userId)}>{username}</span>
                {logEntry.type === "soundboard" ? (
                    <div className={cl("soundboard-info")}>
                        {logEntry.emoji && <img className={cl("soundboard-emoji")} src={getEmojiUrl(logEntry.emoji)} alt={logEntry.emoji.name} />}
                        <span className={cl("soundboard-id")}>サウンドボードのサウンドを再生しました</span>
                        <div className={cl("soundboard-actions")}>
                            <Tooltip text="サウンドを再生">
                                {tooltipProps => (
                                    <Clickable {...tooltipProps} className={cl("soundboard-action")} onClick={() => playSound(logEntry.soundId!)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
                                    </Clickable>
                                )}
                            </Tooltip>
                            <Tooltip text="サウンドを保存">
                                {tooltipProps => (
                                    <Clickable {...tooltipProps} className={cl("soundboard-action")} onClick={() => downloadSound(logEntry.soundId!)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                    </Clickable>
                                )}
                            </Tooltip>
                        </div>
                    </div>
                ) : (logEntry.type === "activity" || logEntry.type === "activity_stop") && logEntry.applicationId ? (
                    <div className={cl("soundboard-info")}>
                        <span className={cl("soundboard-id")}>{description}</span>
                        <div className={cl("soundboard-actions")}>
                            <Tooltip text="アクティビティを表示">
                                {tooltipProps => (
                                    <Clickable
                                        {...tooltipProps}
                                        className={cl("soundboard-action")}
                                        onClick={() => {
                                            closeAllModals();
                                            NavigationRouter.transitionTo(`/application-directory/${logEntry.applicationId}`);
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
                                    </Clickable>
                                )}
                            </Tooltip>
                        </div>
                    </div>
                ) : (
                    <span className={cl("description")}>{description}</span>
                )}
            </div>
        </li>
    );
}
