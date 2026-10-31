/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading } from "@components/Heading";
import { classNameFactory } from "@utils/css";
import { RenderModalProps } from "@vencord/discord-types";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, closeModal, DraftType, Modal, openModal, showToast, TextInput, UploadManager, useState } from "@webpack/common";

import { ScheduledAttachment } from "../types";
import { addScheduledMessage, getChannelDisplayInfo } from "../utils";
import { ErrorIcon } from "./Icons";

const cl = classNameFactory("vc-scheduled-msg-");
const ComponentDispatch = findByPropsLazy("dispatchToLastSubscribed");

function ScheduleTimeModalInner({ channelId, content, attachments, rootProps, close }: {
    channelId: string;
    content: string;
    attachments?: ScheduledAttachment[];
    rootProps: RenderModalProps;
    close: () => void;
}) {
    const [scheduleType, setScheduleType] = useState<"delay" | "time">("delay");
    const [delayMinutes, setDelayMinutes] = useState("5");
    const [scheduledDateTime, setScheduledDateTime] = useState("");
    const [error, setError] = useState("");

    const { name, avatar } = getChannelDisplayInfo(channelId);
    const channel = ChannelStore.getChannel(channelId);
    if (!channel) return null;

    const isDM = channel.isPrivate();

    const handleSchedule = async () => {
        let scheduledTime: number;

        if (scheduleType === "delay") {
            const minutes = parseInt(delayMinutes, 10);
            if (isNaN(minutes) || minutes < 1) {
                setError("有効な遅延を入力してください（最低1分）");
                return;
            }
            scheduledTime = Date.now() + minutes * 60 * 1000;
        } else {
            const dateTime = new Date(scheduledDateTime).getTime();
            if (isNaN(dateTime) || dateTime <= Date.now()) {
                setError("未来の日時を選択してください");
                return;
            }
            scheduledTime = dateTime;
        }

        const result = await addScheduledMessage(channelId, content, scheduledTime, attachments);

        if (result.success) {
            ComponentDispatch.dispatchToLastSubscribed("CLEAR_TEXT");
            UploadManager.clearAll(channelId, DraftType.ChannelMessage);
            showToast({ text: "メッセージを予約しました！", variant: "success" });
            close();
        } else {
            setError(result.error ?? "メッセージの予約に失敗しました");
        }
    };

    return (
        <Modal
            {...rootProps}
            size="sm"
            title="メッセージを予約"
            actions={[
                {
                    text: "予約する",
                    variant: "primary",
                    onClick: handleSchedule
                },
                {
                    text: "キャンセル",
                    variant: "secondary",
                    onClick: close
                }
            ]}
        >
            <div className={cl("channel-info")}>
                {avatar && <img src={avatar} className={cl("channel-avatar")} alt="" />}
                <span className={cl("channel-text")}>
                    予約先：<strong>{isDM ? name : `#${name}`}</strong>
                </span>
            </div>

            <Heading tag="h5" className={cl("field-label")}>予約タイプ</Heading>
            <div className={cl("schedule-type-buttons")}>
                <Button
                    size="small"
                    variant={scheduleType === "delay" ? "primary" : "secondary"}
                    onClick={() => setScheduleType("delay")}
                >
                    遅延
                </Button>
                <Button
                    size="small"
                    variant={scheduleType === "time" ? "primary" : "secondary"}
                    onClick={() => setScheduleType("time")}
                >
                    日時を指定
                </Button>
            </div>

            {scheduleType === "delay" ? (
                <>
                    <Heading tag="h5" className={cl("field-label")}>遅延（分）</Heading>
                    <TextInput
                        value={delayMinutes}
                        onChange={setDelayMinutes}
                        placeholder="5"
                        type="number"
                    />
                </>
            ) : (
                <>
                    <Heading tag="h5" className={cl("field-label")}>日時</Heading>
                    <input
                        type="datetime-local"
                        className={cl("datetime-input")}
                        value={scheduledDateTime}
                        onChange={e => setScheduledDateTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                    />
                </>
            )}

            {error && (
                <div className={cl("error")}>
                    <ErrorIcon />
                    <span>{error}</span>
                </div>
            )}
        </Modal>
    );
}

export const ScheduleTimeModal = ErrorBoundary.wrap(ScheduleTimeModalInner, { noop: true });

export function openScheduleTimeModal(channelId: string, content: string, attachments?: ScheduledAttachment[]): void {
    const key = openModal(props => (
        <ScheduleTimeModal
            channelId={channelId}
            content={content}
            attachments={attachments}
            rootProps={props}
            close={() => closeModal(key)}
        />
    ));
}
