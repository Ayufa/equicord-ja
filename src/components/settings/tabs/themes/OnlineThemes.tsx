/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { Link } from "@components/Link";
import { Notice } from "@components/Notice";
import { Paragraph } from "@components/Paragraph";
import { classNameFactory } from "@utils/css";
import { Margins } from "@utils/margins";
import { useAwaiter } from "@utils/react";
import { React, TextInput } from "@webpack/common";

const cl = classNameFactory("vc-settings-theme-");

export function Validator({ link, onValidate }: { link: string; onValidate: (valid: boolean) => void; }) {
    const [res, err, pending] = useAwaiter(() => fetch(link).then(res => {
        if (res.status > 300) throw `${res.status} ${res.statusText}`;
        const contentType = res.headers.get("Content-Type");
        if (!contentType?.startsWith("text/css") && !contentType?.startsWith("text/plain")) {
            onValidate(false);
            throw "CSS ファイルではありません。raw リンクを使ってください！";
        }

        onValidate(true);
        return "OK！";
    }));

    const text = pending
        ? "確認中…"
        : err
            ? `エラー: ${err instanceof Error ? err.message : String(err)}`
            : "有効です！";

    return <Paragraph style={{
        color: pending ? "var(--text-muted)" : err ? "var(--text-feedback-critical)" : "var(--status-positive)"
    }}>{text}</Paragraph>;
}

export interface OnlineThemesSectionProps {
    enableOnlineThemes: boolean;
    setEnableOnlineThemes: (value: boolean) => void;
    currentThemeLink: string;
    setCurrentThemeLink: (value: string) => void;
    themeLinkValid: boolean;
    setThemeLinkValid: (value: boolean) => void;
    addThemeLink: (link: string) => void;
}

export function OnlineThemesSection({
    enableOnlineThemes,
    setEnableOnlineThemes,
    currentThemeLink,
    setCurrentThemeLink,
    themeLinkValid,
    setThemeLinkValid,
    addThemeLink
}: OnlineThemesSectionProps) {
    return (
        <>
            <Heading className={Margins.top20}>オンラインテーマ</Heading>
            <Paragraph className={Margins.bottom16}>
                ローカルファイルの代わりに、URL から直接テーマを読み込みます。オンラインテーマはソースが変更されると自動で更新されるため、手動でダウンロードしなくても常に最新版を使えます。
            </Paragraph>
            <FormSwitch
                title="オンラインテーマを有効化"
                description="オンラインテーマの読み込みを切り替えます。無効にすると、すべてのオンラインテーマがオフになり、新しいテーマを追加できなくなります。"
                value={enableOnlineThemes}
                onChange={setEnableOnlineThemes}
            />

            <Notice.Info className={Margins.bottom16} style={{ width: "100%" }}>
                テーマをお探しですか？ <Link href="https://betterdiscord.app/themes">BetterDiscord Themes</Link> をチェックするか、<Link href="https://github.com/search?q=discord+theme">GitHub</Link> で検索してください。BetterDiscord からダウンロードする場合は「Download」をクリックし、.theme.css ファイルをテーマフォルダーに入れてください。
            </Notice.Info>

            <div className={cl("link-row")}>
                <TextInput
                    placeholder="https://example.com/theme.css"
                    value={currentThemeLink}
                    onChange={setCurrentThemeLink}
                    disabled={!enableOnlineThemes}
                />
                <Button onClick={() => addThemeLink(currentThemeLink)} disabled={!themeLinkValid || !enableOnlineThemes}>
                    追加
                </Button>
            </div>
            {currentThemeLink && (
                <div className={Margins.top8}>
                    <Validator link={currentThemeLink} onValidate={setThemeLinkValid} />
                </div>
            )}
        </>
    );
}
