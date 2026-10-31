/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { HeadingSecondary } from "@components/Heading";
import { OpenExternalIcon } from "@components/Icons";
import { Paragraph } from "@components/Paragraph";
import { copyToClipboard } from "@utils/clipboard";
import { classNameFactory } from "@utils/css";
import { OptionType } from "@utils/types";
import { showToast } from "@webpack/common";

import { authorizeUser, deauthorizeUser } from "./auth";

const cl = classNameFactory("vce-");

export const settings = definePluginSettings({
    hideWarningCard: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "テーマライブラリタブの上部に表示される警告カードを非表示にする",
        restartNeeded: false,
    },
    buttons: {
        type: OptionType.COMPONENT,
        description: "ThemeLibrary ボタン",
        component: () => {
            const handleClick = async () => {
                const token = await DataStore.get("ThemeLibrary_uniqueToken");

                if (!token) return showToast({
                    text: "コピーするトークンがありません。先に認証してください！",
                    variant: "critical",
                    duration: 2.5e3,
                    position: "bottom"
                });

                copyToClipboard(token);

                showToast({
                    text: "クリップボードにコピーしました！",
                    variant: "success",
                    duration: 2.5e3,
                    position: "bottom"
                });
            };

            return (
                <section>
                    <HeadingSecondary style={{ marginTop: 0, marginBottom: 8 }}>ThemeLibrary 認証</HeadingSecondary>
                    <div className={cl("button-grid")}>
                        <Button onClick={() => authorizeUser()}>
                            ThemeLibraryで認証
                        </Button>
                        <Button onClick={handleClick}>
                            ThemeLibraryトークンをコピー
                        </Button>
                        <Button variant="dangerPrimary" onClick={() => deauthorizeUser()}>
                            ThemeLibraryの認証を解除
                        </Button>
                    </div>
                    <HeadingSecondary style={{ marginTop: 8, marginBottom: 8 }}>テーマの削除</HeadingSecondary>
                    <Paragraph style={{ marginTop: 0, marginBottom: 8 }}>すべてのテーマ作者はテーマ情報にクレジットされており、ソースは改変されていません。それでもテーマの削除を希望する場合は、下のボタンからIssueを作成してください。</Paragraph>
                    <div className={cl("button-grid")}>
                        <Button onClick={() => VencordNative.native.openExternal("https://github.com/Faf4a/plugins/issues/new?labels=removal&projects=&template=request_removal.yml&title=Theme+Removal")}>
                            テーマの削除をリクエスト <OpenExternalIcon height={16} width={16} />
                        </Button>
                    </div>
                </section>
            );
        }
    }
});
