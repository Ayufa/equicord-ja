/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 nin0dev
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { ApplicationCommandInputType, ApplicationCommandOptionType, sendBotMessage } from "@api/Commands";
import { getUserSettingLazy } from "@api/UserSettings";
import { InfoIcon } from "@components/Icons";
import { Paragraph } from "@components/Paragraph";
import { Devs } from "@utils/constants";
import { getCurrentChannel, getCurrentGuild } from "@utils/discord";
import definePlugin from "@utils/types";
import { GuildMember } from "@vencord/discord-types";
import { GuildMemberStore, GuildRoleStore, Menu, Parser } from "@webpack/common";

import { showInRoleModal } from "./RoleMembersModal";

const DeveloperMode = getUserSettingLazy("appearance", "developerMode")!;

function getMembersInRole(roleId: string, guildId: string) {
    const members = GuildMemberStore.getMembers(guildId);
    const membersInRole: GuildMember[] = [];
    members.forEach(member => {
        if (member.roles.includes(roleId)) {
            membersInRole.push(member);
        }
    });
    return membersInRole;
}

export default definePlugin({
    name: "InRole",
    description: "ロールのコンテキストメニューや /inrole コマンドで、そのロールに属するユーザーを確認できます（プラグイン情報を読んでください！）",
    tags: ["Commands", "Roles"],
    authors: [Devs.nin0dev],
    dependencies: ["UserSettingsAPI", "CommandsAPI"],
    start() {
        // DeveloperMode needs to be enabled for the context menu to be shown
        DeveloperMode.updateSetting(true);
    },
    settingsAboutComponent: () => {
        return (
            <>
                <Paragraph style={{ fontSize: "1.2rem", marginTop: "15px", fontWeight: "bold" }}>{Parser.parse(":warning:")} 制限事項</Paragraph>
                <Paragraph style={{ marginTop: "10px", fontWeight: "500" }} >サーバーでモデレーター権限を持っていない場合、そのサーバーが大規模（メンバー100人超）だと、プラグインには次の制限がかかります:</Paragraph>
                <Paragraph>• オフラインのメンバーは表示されません</Paragraph>
                <Paragraph>• デフォルトでは最大100人まで表示されます。それ以上表示するには、メンバーリストを下にスクロールして読み込んでください。</Paragraph>
                <Paragraph>• ただし、フレンドはステータスに関係なく常に表示されます。</Paragraph>
            </>
        );
    },

    commands: [
        {
            name: "inrole",
            description: "ロールに属するユーザーを確認",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    name: "role",
                    description: "ロール",
                    type: ApplicationCommandOptionType.ROLE,
                    required: true
                },
            ],
            execute: (args, ctx) => {
                // Guild check
                if (!ctx.guild) {
                    return sendBotMessage(ctx.channel.id, { content: "サーバー内で実行してください。" });
                }
                const role = args[0].value;
                showInRoleModal(getMembersInRole(role, ctx.guild.id), role, ctx.channel.id);
            }
        }
    ],
    contextMenus: {
        "dev-context"(children, { id }: { id: string; }) {
            const guild = getCurrentGuild();
            if (!guild) return;

            const channel = getCurrentChannel();
            if (!channel) return;

            const role = GuildRoleStore.getRole(guild.id, id);
            if (!role) return;

            children.push(
                <Menu.MenuItem
                    id="vc-view-inrole"
                    label="ロール内のメンバーを表示"
                    action={() => {
                        showInRoleModal(getMembersInRole(role.id, guild.id), role.id, channel.id);
                    }}
                    icon={InfoIcon}
                    leadingAccessory={{ type: "icon", icon: InfoIcon }}
                />
            );
        },
        "message"(children, { message }: { message: any; }) {
            const guild = getCurrentGuild();
            if (!guild) return;

            const roleMentions = message.content.match(/<@&(\d+)>/g);
            if (!roleMentions?.length) return;

            const channel = getCurrentChannel();
            if (!channel) return;

            const roleIds = roleMentions.map(mention => mention.match(/<@&(\d+)>/)![1]);

            const role = GuildRoleStore.getRole(guild.id, roleIds);
            if (!role) return;

            children.push(
                <Menu.MenuItem
                    id="vc-view-inrole"
                    label="ロール内のメンバーを表示"
                    action={() => {
                        showInRoleModal(getMembersInRole(role.id, guild.id), role.id, channel.id);
                    }}
                    icon={InfoIcon}
                    leadingAccessory={{ type: "icon", icon: InfoIcon }}
                />
            );
        }
    }
});
