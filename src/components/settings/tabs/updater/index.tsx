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

import { useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Margins } from "@utils/margins";
import { useAwaiter } from "@utils/react";
import { getRepo, isNewer, UpdateLogger } from "@utils/updater";
import { React } from "@webpack/common";

import gitHash from "~git-hash";

import { HashLink, Newer, Updatable } from "./Components";

interface CommonProps {
    repo: string;
    repoPending: boolean;
}

function EquibopSection() {
    if (!IS_EQUIBOP) return null;

    const [isEquibopOutdated] = useAwaiter<boolean>(VesktopNative.app.isOutdated, { fallbackValue: false });

    return (
        <Flex className={Margins.bottom20} flexDirection="column" gap="1em">
            <Card variant="brand">
                <Heading tag="h3" className={Margins.bottom8}>Equibop & Equicord</Heading>
                <Paragraph>Equibop と Equicord は別々のものです。このアップデーターは Equicord 用です。</Paragraph>
                <Paragraph className={Margins.top8}>
                    Equibop の更新については別途ポップアップが表示されます。手動で更新するには、<Link href="https://equibop.org/install">最新バージョン</Link> をインストールしてください。
                </Paragraph>
            </Card>

            {isEquibopOutdated && (
                <Card variant="warning">
                    <Heading tag="h3" className={Margins.bottom8}>Equibop が古くなっています</Heading>
                    <Flex flexDirection="column" gap="0.5em">
                        <Paragraph>お使いの Equibop のバージョンが古くなっています！</Paragraph>
                        <Button variant="link" onClick={() => VesktopNative.app.openUpdater()}>Equibop アップデーターを開く</Button>
                    </Flex>
                </Card>
            )}
        </Flex>
    );
}

function Updater() {
    const settings = useSettings(["autoUpdate", "autoUpdateNotification"]);

    const [repo, err, repoPending] = useAwaiter(getRepo, { fallbackValue: "読み込み中…" });

    React.useEffect(() => {
        if (err)
            UpdateLogger.error("Failed to retrieve repo", err);
    }, [err]);

    const commonProps: CommonProps = {
        repo,
        repoPending
    };

    return (
        <SettingsTab>
            <EquibopSection />
            <Heading className={Margins.top16}>更新設定</Heading>
            <Paragraph className={Margins.bottom20}>
                Equicord の更新方法を制御します。バックグラウンドで自動的に更新するか、新しい更新があるときに通知を受け取るか選べます。
            </Paragraph>

            <div className="vc-settings-switches">
                <FormSwitch
                    title="自動的に更新"
                    description="有効にすると、Equicord は確認を求めずにバックグラウンドで更新を自動的にダウンロードしてインストールします。変更を適用するには Discord の再起動が必要です。"
                    value={settings.autoUpdate}
                    onChange={(v: boolean) => settings.autoUpdate = v}
                    hideBorder
                />
                <FormSwitch
                    title="自動更新が完了したときに通知を受け取る"
                    description="Equicord がバックグラウンドで更新のダウンロードを終えたら通知を受け取り、Discord を再起動するタイミングが分かります。"
                    value={settings.autoUpdateNotification}
                    onChange={(v: boolean) => settings.autoUpdateNotification = v}
                    disabled={!settings.autoUpdate}
                    hideBorder
                />
            </div>

            <Divider className={Margins.top20} />

            <Heading className={Margins.top20}>リポジトリ</Heading>
            <Paragraph className={Margins.bottom8}>
                Equicord が更新を取得する GitHub リポジトリです。
            </Paragraph>
            <Paragraph color="text-subtle">
                {repoPending
                    ? repo
                    : err
                        ? "取得に失敗しました - コンソールを確認してください"
                        : (
                            <Link href={repo}>
                                {repo.split("/").slice(-2).join("/")}
                            </Link>
                        )
                }
                {" "}(<HashLink hash={gitHash} repo={repo} disabled={repoPending} />)
            </Paragraph>

            <Divider className={Margins.top20} />

            <Heading className={Margins.top20}>更新</Heading>
            {isNewer ? <Newer {...commonProps} /> : <Updatable {...commonProps} />}
        </SettingsTab>
    );
}

export default IS_UPDATER_DISABLED
    ? null
    : wrapTab(Updater, "アップデーター");
