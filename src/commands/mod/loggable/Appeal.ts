import { Command, ClientStorage, GuildStorage } from '@yamdbf/core';
import { Message, TextChannel, Guild, MessageEmbed } from 'discord.js';
import { ModClient } from '../../../client/ModClient';

export default class extends Command<ModClient>
{
	public constructor()
	{
		super({
			name: 'appeal',
			desc: 'Appeal a ban',
			usage: '<prefix>appeal <message>',
			ratelimit: '5/10m',
			group: 'mod'
		});
	}

	public async action(message: Message, args: string[]): Promise<any>
	{
		if (message.channel.type !== 'dm') return;
		const storage: ClientStorage = this.client.storage;
		const activeBans: ActiveBans = await storage.get('activeBans') || {};

		const activeAppeals: ActiveAppeals = await storage.get('activeAppeals') || {};
		const bans: BanObject[] = activeBans[message.author.id];

		if (!bans) return message.channel.send('You do not have any bans eligible for appeal.');
		else if (activeAppeals && activeAppeals[message.author.id])
			return message.channel.send(
				`You currently have a pending appeal and may not place another until it has been reviewed.`);

		const ban: BanObject = bans.slice(-1)[0];
		const reason: string = args.join(' ');

		if (!reason) return message.channel.send(
			'You must provide an appeal message if you want to appeal a ban. Please limit the message to 1,000 characters or less.');

		if (reason.length > 1000) return message.channel.send(
			'You must limit your appeal message to 1,000 characters or less.');

		const guild: Guild = this.client.guilds.get(ban.guild);
		const embed: MessageEmbed = new MessageEmbed()
			.setColor(65454)
			.setAuthor(ban.raw, message.author.avatarURL())
			.addField('Appeal message', reason)
			.addField('Actions',
				`To approve this appeal, use \`${await this.client.getPrefix(guild)}approve ${ban.user}\`\n`
				+ `To reject this appeal, use \`${await this.client.getPrefix(guild)}reject ${ban.user} <...reason>\``)
			.setTimestamp();

		const guildStorage: GuildStorage = this.client.storage.guilds.get(guild.id);
		const appealsChannel: TextChannel = <TextChannel> guild.channels.get(await guildStorage.settings.get('appeals'));
		if (!appealsChannel) return message.channel.send(
			'The server you are trying to appeal to does not have appeals configured.');

		let appeal: Message;
		try { appeal = <Message> await appealsChannel.send({ embed }); }
		catch { return message.channel.send('There was an error submitting your appeal.'); }

		activeAppeals[message.author.id] = appeal.id;
		await storage.set('activeAppeals', activeAppeals);
		message.channel.send(
			'Your appeal has been received. You will be notified when it is approved or rejected.');
	}
}
