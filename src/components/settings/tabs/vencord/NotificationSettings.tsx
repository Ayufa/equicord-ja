/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { ErrorCard } from "@components/ErrorCard";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { Modal, openModal, Select, Slider } from "@webpack/common";

export function NotificationSection() {
    return (
        <section className={Margins.top16}>
            <Heading>通知</Heading>
            <Paragraph className={Margins.bottom8}>
                Vencord が送る通知の設定です。
                Discord の通知 (メッセージなど) は含みません
            </Paragraph>
            <Flex>
                <Button onClick={openNotificationSettingsModal}>
                    通知設定
                </Button>
                <Button onClick={openNotificationLogModal}>
                    通知ログを見る
                </Button>
            </Flex>
        </section>
    );
}

export function openNotificationSettingsModal() {
    openModal(props => (
        <Modal
            {...props}
            size="lg"
            title="通知設定"
        >
            <NotificationSettings />
        </Modal>
    ));
}

function NotificationSettings() {
    const settings = useSettings(["notifications.*"]).notifications;

    return (
        <>
            <Heading tag="h5">通知のスタイル</Heading>
            {settings.useNative !== "never" && Notification?.permission === "denied" && (
                <ErrorCard style={{ padding: "1em" }} className={Margins.bottom8}>
                    <Heading>デスクトップ通知の権限が拒否されています</Heading>
                    <Paragraph>通知の権限が拒否されているため、デスクトップ通知は動作しません。</Paragraph>
                </ErrorCard>
            )}
            <Paragraph className={Margins.bottom8}>
                一部のプラグインは通知を表示することがあります。通知には2つのスタイルがあります。
                <ul>
                    <li><strong>Equicord 通知</strong>：アプリ内通知です</li>
                    <li><strong>デスクトップ通知</strong>：OS 標準のデスクトップ通知です (メンションされたときのような通知)</li>
                </ul>
            </Paragraph>
            <Select
                placeholder="通知のスタイル"
                options={[
                    { label: "Discord がフォーカスされていないときだけデスクトップ通知を使う", value: "not-focused", default: true },
                    { label: "常にデスクトップ通知を使う", value: "always" },
                    { label: "常に Equicord 通知を使う", value: "never" },
                ] satisfies Array<{ value: typeof settings["useNative"]; } & Record<string, any>>}
                closeOnSelect={true}
                select={v => settings.useNative = v}
                isSelected={v => v === settings.useNative}
                serialize={identity}
            />

            <Heading className={Margins.top16 + " " + Margins.bottom8}>通知の位置</Heading>
            <Select
                isDisabled={settings.useNative === "always"}
                placeholder="通知の位置"
                options={[
                    { label: "右下", value: "bottom-right", default: true },
                    { label: "右上", value: "top-right" },
                ] satisfies Array<{ value: typeof settings["position"]; } & Record<string, any>>}
                select={v => settings.position = v}
                isSelected={v => v === settings.position}
                serialize={identity}
            />

            <Heading className={Margins.top16 + " " + Margins.bottom8}>見逃した通知の件数</Heading>
            <FormSwitch
                title="Discord にフォーカスを戻したとき、見逃した通知の件数をポップアップで知らせる"
                value={settings.missed}
                onChange={(v: boolean) => settings.missed = v}
            />

            <Heading className={Margins.top16 + " " + Margins.bottom8}>通知のタイムアウト</Heading>
            <Paragraph className={Margins.bottom16}>0秒に設定すると、自動では消えなくなります</Paragraph>
            <Slider
                disabled={settings.useNative === "always"}
                markers={[0, 1000, 2500, 5000, 10_000, 20_000]}
                minValue={0}
                maxValue={20_000}
                initialValue={settings.timeout}
                onValueChange={v => settings.timeout = v}
                onValueRender={v => (v / 1000).toFixed(2) + "s"}
                onMarkerRender={v => (v / 1000) + "s"}
                stickToMarkers={false}
            />

            <Heading className={Margins.top16 + " " + Margins.bottom8}>通知ログの上限</Heading>
            <Paragraph className={Margins.bottom16}>
                古いものが削除されるまでに、ログへ保存しておく通知の数です。
                <code>0</code> に設定すると通知ログが無効になり、<code>∞</code> に設定すると古い通知が自動で削除されなくなります
            </Paragraph>
            <Slider
                markers={[0, 25, 50, 75, 100, 200]}
                minValue={0}
                maxValue={200}
                stickToMarkers={true}
                initialValue={settings.logLimit}
                onValueChange={v => settings.logLimit = v}
                onValueRender={v => v === 200 ? "∞" : v}
                onMarkerRender={v => v === 200 ? "∞" : v}
            />
        </>
    );
}
