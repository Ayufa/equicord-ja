/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import ErrorBoundary from "@components/ErrorBoundary";
import { Paragraph } from "@components/Paragraph";
import { findByCodeLazy, findComponentByCodeLazy } from "@webpack";
import { moment, useRef, UserStore, useState } from "@webpack/common";

import customTimestamps from ".";

type TimeFormat = {
    name: string;
    description: string;
    default: string;
    offset: number;
};
const MessagePreview = findComponentByCodeLazy<{
    author: any,
    message: any,
    compact: boolean,
    isGroupStart: boolean,
    className: string,
    hideSimpleEmbedContent: boolean;
}>(/previewGuildId:\i,preview:\i,/);
const createBotMessage = findByCodeLazy('username:"Clyde"');
const populateMessagePrototype = findByCodeLazy("isProbablyAValidSnowflake", "messageReference:");

export const timeFormats: Record<string, TimeFormat> = {
    cozyFormat: {
        name: "コージーモード",
        description: "コージーモードのメッセージで使用する時刻形式",
        default: "[calendar]",
        offset: 0,
    },
    compactFormat: {
        name: "コンパクトモード",
        description: "コンパクトモードとメッセージへのホバー時に使用する時刻形式",
        default: "LT",
        offset: 0,
    },
    tooltipFormat: {
        name: "ツールチップ",
        description: "ツールチップで使用する時刻形式",
        default: "LLLL • [relative]",
        offset: 0,
    },
    ariaLabelFormat: {
        name: "Aria ラベル",
        description: "Aria ラベルで使用する時刻形式",
        default: "[calendar]",
        offset: 0,
    },
    sameDayFormat: {
        name: "同じ日",
        description: "今日用の [calendar] 形式",
        default: "[Today at] HH:mm:ss",
        offset: 0,
    },
    lastDayFormat: {
        name: "前日",
        description: "昨日用の [calendar] 形式",
        default: "[Yesterday at] HH:mm:ss",
        offset: -1000 * 60 * 60 * 24,
    },
    lastWeekFormat: {
        name: "先週",
        description: "過去1週間用の [calendar] 形式",
        default: "ddd DD.MM.YYYY HH:mm:ss",
        offset: -1000 * 60 * 60 * 24 * 6, // setting an offset of a week exactly pushes it into "older date" territory as soon as a second passes
    },
    sameElseFormat: {
        name: "それ以前の日付",
        description: "それ以前の日付用の [calendar] 形式",
        default: "ddd DD.MM.YYYY HH:mm:ss",
        offset: -1000 * 60 * 60 * 24 * 31,
    }
};

const DemoMessage = (props: { msgId, compact, message, date: Date | undefined, isGroupStart?: boolean; }) => {
    const message = createBotMessage({ content: props.message, channelId: "1337", embeds: [] });
    message.author = UserStore.getCurrentUser();
    message.id = props.msgId;
    message.timestamp = moment(props.date ?? new Date());
    const user = UserStore.getCurrentUser();
    const populatedMessage = message && populateMessagePrototype(message);
    return populatedMessage ? (
        <div className="vc-cmt-demo-message">
            <MessagePreview
                author={{ ...user, nick: user.globalName || user.username }}
                message={populatedMessage}
                compact={props.compact}
                isGroupStart={props.isGroupStart || false}
                className="vc-cmt-demo-message-preview"
                hideSimpleEmbedContent={true}
            />
        </div>
    ) : <div className="vc-cmt-demo-message">
        <Paragraph>
            {/* @ts-ignore */}
            <b>プレビュー:</b> {customTimestamps.renderTimestamp(date, "cozy")}
        </Paragraph>
    </div>;
};

export const DemoMessageContainer = ErrorBoundary.wrap(() => {
    const [isCompact, setIsCompact] = useState(false);
    const today = useRef<Date>(new Date());
    const yesterday = useRef<Date>(new Date(Date.now() + timeFormats.lastDayFormat.offset));
    const lastWeek = useRef<Date>(new Date(Date.now() + timeFormats.lastWeekFormat.offset));
    const aMonthAgo = useRef<Date>(new Date(Date.now() + timeFormats.sameElseFormat.offset));

    return (
        <div className={"vc-cmt-demo-message-container"} onClick={() => setIsCompact(!isCompact)}>
            <DemoMessage compact={isCompact} msgId={"1337"}
                message={`クリックすると${isCompact ? "コージー" : "コンパクト"}モードに切り替わります`} isGroupStart={true}
                date={aMonthAgo.current} />
            <DemoMessage compact={isCompact} msgId={"1338"} message={"このメッセージは先週送信されました"}
                isGroupStart={true} date={lastWeek.current} />
            <DemoMessage compact={isCompact} msgId={"1339"} message={"タイムスタンプにホバーするとツールチップ形式が見られます"}
                isGroupStart={true} date={yesterday.current} />
            <DemoMessage compact={isCompact} msgId={"1340"} message={"下の形式を編集すると、ここにリアルタイムで反映されます"} isGroupStart={true}
                date={today.current} />
        </div>
    );
}, { noop: true });
