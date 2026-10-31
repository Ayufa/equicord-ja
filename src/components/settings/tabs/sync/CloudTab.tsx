/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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
import { authorizeCloud, deauthorizeCloud } from "@api/SettingsSync/cloudSetup";
import { deleteCloudSettings, eraseAllCloudData, getCloudSettings, putCloudSettings } from "@api/SettingsSync/cloudSync";
import { Button } from "@components/Button";
import { CheckedTextInput } from "@components/CheckedTextInput";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { CloudDownloadIcon, CloudUploadIcon, SkullIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { Notice } from "@components/Notice";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { localStorage } from "@utils/localStorage";
import { Margins } from "@utils/margins";
import { useForceUpdater } from "@utils/react";
import { findComponentByCodeLazy } from "@webpack";
import { Alerts, SearchableSelect, Select, useState } from "@webpack/common";

const ICON_STYLE: React.CSSProperties = { width: 20, height: 20, borderRadius: 4, verticalAlign: "middle" };

function EquicordIcon() {
    return <img src="https://equicord.org/assets/favicon.png" alt="Equicord" style={ICON_STYLE} />;
}

function VencordIcon() {
    return <img src="https://equicord.org/assets/icons/vencord/icon-light.png" alt="Vencord" style={ICON_STYLE} />;
}

const RefreshIcon = findComponentByCodeLazy("M4 12a8 8 0 0 1 14.93-4H15");
const TrashIcon = findComponentByCodeLazy("2.81h8.36a3");

function validateUrl(url: string) {
    try {
        new URL(url);
        return true;
    } catch {
        return "無効な URL";
    }
}

const cloudBackendOptions = [
    { label: "Equicord Cloud", value: "https://cloud.equicord.org/" },
    { label: "Vencord Cloud", value: "https://api.vencord.dev/" }
];

const syncDirectionOptions = [
    { label: "双方向同期（変更は両方向に反映）", value: "both" },
    { label: "このデバイスをソースにする（アップロードのみ）", value: "push" },
    { label: "クラウドをソースにする（ダウンロードのみ）", value: "pull" },
    { label: "自動同期しない（下のボタンで手動同期のみ）", value: "manual" }
];

function CloudTab() {
    const settings = useSettings(["cloud.authenticated", "cloud.url", "cloud.settingsSync"]);
    const [inputKey, setInputKey] = useState(0);
    const forceUpdate = useForceUpdater();

    const { cloud } = settings;
    const isAuthenticated = cloud.authenticated;
    const syncEnabled = isAuthenticated && cloud.settingsSync;

    async function changeUrl(url: string) {
        cloud.url = url;
        cloud.authenticated = false;

        await deauthorizeCloud();
        await authorizeCloud();

        setInputKey(prev => prev + 1);
    }

    return (
        <SettingsTab>
            <Heading className={Margins.top16}>クラウド連携</Heading>
            <Paragraph className={Margins.bottom16}>
                Equicord のクラウド連携を使うと、複数のデバイスや Discord のインストール間で設定を同期できます。データは安全に保存され、いつでも簡単に復元できます。
            </Paragraph>

            <Notice.Info className={Margins.bottom16}>
                私たちは独自の <Link href="https://github.com/Equicord/Equicloud">Equicloud バックエンド</Link> を、機能を強化して使用しています。
                何を保存し、データをどう使うかについては、<Link href="https://equicord.org/cloud/policy">プライバシーポリシー</Link> をご覧ください。
                Equicloud は BSD 3.0 ライセンスなので、希望すればセルフホストもできます。
            </Notice.Info>

            <FormSwitch
                title="クラウド連携を有効化"
                description="設定同期のためにクラウドバックエンドに接続します。クラウド連携をまだ設定していない場合は、承認を求められます。"
                value={isAuthenticated}
                onChange={v => {
                    if (v)
                        authorizeCloud();
                    else
                        cloud.authenticated = v;
                }}
                hideBorder
            />

            <Divider className={Margins.top20} />

            <Heading className={Margins.top20}>クラウドバックエンド</Heading>
            <Paragraph className={Margins.bottom16}>
                設定の保存に使うクラウドバックエンドを選んでください。Equicord と Vencord のクラウドサービスを切り替えたり、セルフホストしたインスタンスを使ったりできます。
            </Paragraph>

            <div className={Margins.bottom8}>
                <SearchableSelect
                    options={cloudBackendOptions}
                    value={cloudBackendOptions.find(o => o.value === cloud.url)?.value}
                    onChange={v => changeUrl(v)}
                    closeOnSelect={true}
                    renderOptionPrefix={o => o?.value?.includes("equicord") ? <EquicordIcon /> : <VencordIcon />}
                />
            </div>

            <Flex gap="8px" alignItems="center">
                <div style={{ flex: 1 }}>
                    <CheckedTextInput
                        key={`backendUrl-${inputKey}`}
                        initialValue={cloud.url}
                        onChange={async v => {
                            cloud.url = v;
                            cloud.authenticated = false;
                            await deauthorizeCloud();
                        }}
                        validate={validateUrl}
                    />
                </div>
                <Button
                    disabled={!isAuthenticated}
                    onClick={async () => {
                        cloud.authenticated = false;
                        await deauthorizeCloud();
                        await authorizeCloud();
                    }}
                >
                    <Flex gap="8px" alignItems="center">
                        <RefreshIcon color="currentColor" />
                        再承認
                    </Flex>
                </Button>
            </Flex>

            <Divider className={Margins.top20} />

            <Heading className={Margins.top20}>設定の同期</Heading>
            <Paragraph className={Margins.bottom16}>
                Equicord の設定をクラウドに同期します。手動のインポート/エクスポートなしで、複数のデバイス間で構成を簡単に統一できます。
            </Paragraph>

            <FormSwitch
                title="設定の同期を有効化"
                description="有効にすると、設定をクラウドとの間で同期できます。下の操作で手動同期もできます。"
                value={cloud.settingsSync}
                onChange={v => { cloud.settingsSync = v; }}
                disabled={!isAuthenticated}
                hideBorder
            />

            <Divider className={Margins.top20} />

            <Heading className={Margins.top20}>このデバイスの同期ルール</Heading>
            <Paragraph className={Margins.bottom16}>
                この設定は、<strong>このデバイス</strong> とクラウドの間で設定がどう移動するかを制御します。変更を双方向に流すことも、どちらか一方を主要なソースにすることもできます。
            </Paragraph>

            <Select
                options={syncDirectionOptions}
                isSelected={v => v === (localStorage.Vencord_cloudSyncDirection ?? "both")}
                select={v => {
                    localStorage.Vencord_cloudSyncDirection = v;
                    forceUpdate();
                }}
                serialize={v => v}
                isDisabled={!syncEnabled}
            />

            <Flex gap="8px" className={Margins.top16}>
                <Button
                    style={{ flex: 1 }}
                    disabled={!syncEnabled}
                    onClick={() => putCloudSettings(true)}
                >
                    <Flex gap="8px" alignItems="center">
                        <CloudUploadIcon />
                        クラウドへ同期
                    </Flex>
                </Button>
                <Button
                    style={{ flex: 1 }}
                    disabled={!syncEnabled}
                    onClick={() => getCloudSettings(true, true)}
                >
                    <Flex gap="8px" alignItems="center">
                        <CloudDownloadIcon />
                        クラウドから同期
                    </Flex>
                </Button>
            </Flex>

            {!isAuthenticated && (
                <Notice.Warning className={Margins.top8}>
                    設定同期機能を使うには、上のクラウド連携を有効にしてください。
                </Notice.Warning>
            )}

            <Divider className={Margins.top20} />

            <Heading className={Margins.top20}>危険な操作</Heading>
            <Paragraph className={Margins.bottom16}>
                クラウドからすべてのデータを完全に削除します。この操作は取り消せず、同期されたすべての設定と、クラウドバックエンドに保存されたその他のデータが削除されます。
            </Paragraph>

            <Flex gap="8px">
                <Button
                    variant="dangerPrimary"
                    size="medium"
                    disabled={!syncEnabled}
                    onClick={() => deleteCloudSettings()}
                >
                    <Flex gap="8px" alignItems="center">
                        <TrashIcon color="currentColor" />
                        クラウド設定を削除
                    </Flex>
                </Button>
                <Button
                    variant="dangerSecondary"
                    size="medium"
                    disabled={!isAuthenticated}
                    onClick={() => Alerts.show({
                        title: "クラウドアカウントを削除",
                        body: "クラウドアカウントと関連するすべてのデータを完全に削除してもよろしいですか？この操作は取り消せません。",
                        onConfirm: eraseAllCloudData,
                        confirmText: "アカウントを削除",
                        confirmColor: "vc-cloud-erase-data-danger-btn",
                        cancelText: "キャンセル"
                    })}
                >
                    <Flex gap="8px" alignItems="center">
                        <SkullIcon />
                        クラウドアカウントを削除
                    </Flex>
                </Button>
            </Flex>
        </SettingsTab>
    );
}

export default wrapTab(CloudTab, "クラウド");
