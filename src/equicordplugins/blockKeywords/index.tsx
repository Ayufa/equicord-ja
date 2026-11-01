/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Card } from "@components/Card";
import { Heading } from "@components/Heading";
import { ErrorBoundary } from "@components/index";
import { Margins } from "@components/margins";
import { EquicordDevs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";
import { Message } from "@vencord/discord-types";
import { React, TextInput } from "@webpack/common";

let blockedKeywords: Array<RegExp>;
const cl = classNameFactory("vc-block-keywords-");

function splitPatterns(input: string): string[] {
    return input
        .replace(/\[([^\]]*)\]/g, m => m.replace(/,/g, "\x00")) // protect commas in [...]
        .replace(/\{(\d+,?\d*|,\d+)\}/g, m => m.replace(",", "\x00")) // protect commas in {n,m}
        .split(",")
        .map(s => s.replace(/\x00/g, ",").trim())
        .filter(Boolean);
}

function RegexHelper() {
    const [testInput, setTestInput] = React.useState("");
    const { blockedWords, caseSensitive, useRegex } = settings.use(["blockedWords", "caseSensitive", "useRegex"]);

    const results = React.useMemo(() => {
        const caseSensitiveFlag = caseSensitive ? "" : "i";
        return splitPatterns(blockedWords)
            .map(pattern => {
                try {
                    const regex = useRegex
                        ? new RegExp(pattern, caseSensitiveFlag)
                        : new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, caseSensitiveFlag);
                    return { pattern, matches: regex.test(testInput) };
                } catch (e: unknown) {
                    return { pattern, matches: false, error: e instanceof Error ? e.message : String(e) };
                }
            });
    }, [testInput, blockedWords, caseSensitive, useRegex]);

    return (
        <Card className={cl("regex")}>
            <Heading tag="h4" className={Margins.bottom8}>正規表現ヘルパー</Heading>
            <TextInput
                type="text"
                placeholder="テストするテキストを入力..."
                value={testInput}
                onChange={setTestInput}
                maxLength={null}
            />
            {results.length === 0 ?
                <Card
                    key="vc-no-patterns-regex"
                    variant="warning"
                    className={classes(cl("card"), Margins.top8)}
                >
                    <code>パターンが設定されていません</code>
                </Card> : (
                    results.map(({ pattern, matches, error }, i) => (
                        <Card
                            key={`vc-pattern-card-${i}`}
                            variant={error ? "danger" : matches ? "success" : "primary"}
                            className={classes(cl("card"), Margins.top8)}
                        >
                            <code>{pattern}</code>
                            {error && <span className={cl("error")}>{error}</span>}
                        </Card>
                    )))}
        </Card>
    );
}

const settings = definePluginSettings({
    blockedWords: {
        type: OptionType.STRING,
        description: "ブロックする単語のカンマ区切りリスト",
        default: "",
        restartNeeded: true
    },
    useRegex: {
        type: OptionType.BOOLEAN,
        description: "メッセージ内容のチェック時に各値を正規表現として扱います（高度な設定）",
        default: false,
        restartNeeded: true
    },
    regexHelper: {
        type: OptionType.COMPONENT,
        description: "サンプル入力に対して正規表現をテストします",
        component: () => <ErrorBoundary noop><RegexHelper /></ErrorBoundary>,
    },
    caseSensitive: {
        type: OptionType.BOOLEAN,
        description: "大文字・小文字を区別して検索するかどうか",
        default: false,
        restartNeeded: true
    },
    ignoreBlockedMessages: {
        description: "「新着メッセージ」バーを完全に無視します",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true,
    },
}, {
    regexHelper: {
        hidden() { return !this.store.useRegex; }
    }
});

export function containsBlockedKeywords(message: Message) {
    if (!blockedKeywords) return false;

    // test a nullable string against all keywords
    const testField = (text: string | null | undefined) => text != null && blockedKeywords.some(regex => regex.test(text));

    return blockedKeywords.some(regex =>
        regex.test(message.content)) || message.embeds.some(embed =>
            testField(embed.rawDescription) || testField(embed.rawTitle));
}

export default definePlugin({
    name: "BlockKeywords",
    description: "ユーザーが指定したキーワードを含むメッセージを、その送信者をブロックしたかのようにブロックします。",
    tags: ["Appearance", "Customisation", "Privacy"],
    authors: [EquicordDevs.catcraft, EquicordDevs.secp192k1],
    patches: [
        {
            find: "_channelMessages={}",
            predicate: () => settings.store.blockedWords !== "",
            replacement: {
                match: /static commit\((\i)\)\{/g,
                replace: "$&$1=$self.blockMessagesWithKeywords($1);"
            }
        },
        {
            find: '"MessageStore"',
            predicate: () => settings.store.ignoreBlockedMessages && settings.store.blockedWords !== "",
            replacement: [
                {
                    match: /(?<=MESSAGE_CREATE:function\((\i)\){)/,
                    replace: (_, props) => `if($self.containsBlockedKeywords(${props}.message))return;`
                }
            ]
        },
        {
            find: '"ReadStateStore"',
            predicate: () => settings.store.ignoreBlockedMessages && settings.store.blockedWords !== "",
            replacement: [
                {
                    match: /(?<=MESSAGE_CREATE:function\((\i)\){)/,
                    replace: (_, props) => `if($self.containsBlockedKeywords(${props}.message))return;`
                }
            ]
        },
    ],

    settings,
    containsBlockedKeywords,

    start() {
        const blockedWordsList = splitPatterns(settings.store.blockedWords);
        const caseSensitiveFlag = settings.store.caseSensitive ? "" : "i";

        if (blockedWordsList.length === 0) return;

        if (settings.store.useRegex) {
            blockedKeywords = blockedWordsList.map(word => {
                return new RegExp(word, caseSensitiveFlag);
            });
        } else {
            blockedKeywords = blockedWordsList.map(word => {
                // escape regex chars in word https://stackoverflow.com/a/6969486
                return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, caseSensitiveFlag);
            });
        }
    },

    blockMessagesWithKeywords(messageList) {
        return messageList.reset(messageList.map(
            message => message.set("blocked", message.blocked || this.containsBlockedKeywords(message))
        ));
    }
});
