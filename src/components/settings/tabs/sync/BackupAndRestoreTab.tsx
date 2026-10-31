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

import { downloadSettingsBackup, uploadSettingsBackup } from "@api/SettingsSync/offline";
import { Button } from "@components/Button";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Notice } from "@components/Notice";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Margins } from "@utils/margins";

function BackupAndRestoreTab() {
    return (
        <SettingsTab>
            <Heading className={Margins.top16}>バックアップと復元</Heading>
            <Paragraph className={Margins.bottom20}>
                Equicord の設定を JSON ファイルとしてインポート/エクスポートします。設定を別のデバイスへ簡単に移行したり、Equicord や Discord を再インストールした後に復元したりできます。
            </Paragraph>

            <Notice.Warning className={Margins.bottom20}>
                設定ファイルをインポートすると、現在の設定が上書きされます。現在の構成を残したい場合は、先にバックアップをエクスポートしてください。
            </Notice.Warning>

            <Heading>バックアップに含まれるもの</Heading>
            <Paragraph className={Margins.bottom20}>
                • カスタム QuickCSS<br />
                • テーマリンク<br />
                • プラグイン設定<br />
                • DataStore データ
            </Paragraph>

            <Divider className={Margins.bottom20} />

            <Heading>設定をインポート</Heading>
            <Paragraph className={Margins.bottom16}>
                以前にエクスポートした設定ファイルを選んで構成を復元します。現在の設定はすべてバックアップの内容に置き換えられます。
            </Paragraph>

            <Flex gap="8px" className={Margins.bottom20} style={{ flexWrap: "wrap" }}>
                <Button
                    onClick={() => uploadSettingsBackup("all")}
                    size="small"
                    variant="secondary"
                >
                    すべての設定をインポート
                </Button>
                <Button
                    onClick={() => uploadSettingsBackup("plugins")}
                    size="small"
                >
                    プラグインをインポート
                </Button>
                <Button
                    onClick={() => uploadSettingsBackup("css")}
                    size="small"
                >
                    QuickCSS をインポート
                </Button>
                <Button
                    onClick={() => uploadSettingsBackup("datastore")}
                    size="small"
                >
                    DataStore をインポート
                </Button>
            </Flex>

            <Divider className={Margins.bottom20} />

            <Heading>設定をエクスポート</Heading>
            <Paragraph className={Margins.bottom16}>
                現在の設定をバックアップファイルとしてダウンロードします。すべてをまとめてエクスポートすることも、構成の一部だけを選んでエクスポートすることもできます。
            </Paragraph>

            <Flex gap="8px" style={{ flexWrap: "wrap" }}>
                <Button
                    onClick={() => downloadSettingsBackup("all")}
                    size="small"
                    variant="secondary"
                >
                    すべての設定をエクスポート
                </Button>
                <Button
                    onClick={() => downloadSettingsBackup("plugins")}
                    size="small"
                >
                    プラグインをエクスポート
                </Button>
                <Button
                    onClick={() => downloadSettingsBackup("css")}
                    size="small"
                >
                    QuickCSS をエクスポート
                </Button>
                <Button
                    onClick={() => downloadSettingsBackup("datastore")}
                    size="small"
                >
                    DataStore をエクスポート
                </Button>
            </Flex>
        </SettingsTab>
    );
}

export default wrapTab(BackupAndRestoreTab, "バックアップと復元");
