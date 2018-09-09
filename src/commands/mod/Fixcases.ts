import { Command, Message, GuildStorage, Middleware, CommandDecorators } from '@yamdbf/core';
import { TextChannel } from 'discord.js';
import { ModClient } from '../../client/ModClient';
import { modOnly } from '../../util/Util';

const { using } = CommandDecorators;

export default class extends Command<ModClient>
{
	public constructor()
	{
		super({
			name: 'fixcases',
			desc: 'Re-index case numbers',
			usage: '<prefix>fixcases <case msg id>',
			info: 'Must be given the message ID of a case that is known to have a correct number. All the cases after the provided case will be re-indexed in ascending order.',
			group: 'mod',
			guildOnly: true
		});
	}

	@modOnly
	@using(Middleware.expect({ '<case msg id>': 'String' }))
	public async action(message: Message, [id]: [string]): Promise<any>
	{
		if (!/\d+/.test(id))
			return message.channel.send('You must provide a valid case message ID.');

		const storage: GuildStorage = message.guild.storage;
		const logsChannel: TextChannel = <TextChannel> message.guild.channels
			.get(await storage.settings.get('modlogs'));

		const caseRegex: RegExp = /Case (\d+)/;
		let startCase: Message;
		try
		{
			startCase = await logsChannel.messages.fetch(id);
		}
		catch (err)
		{
			return message.channel.send('Failed to fetch the provided case.');
		}
		if (!startCase.embeds[0] || !caseRegex.test(startCase.embeds[0].footer.text))
			return message.channel.send(`Message with that ID was not a valid case.`);

		const caseNum: string = startCase.embeds[0].footer.text.match(caseRegex)[1];
		const working: Message = <Message> await message.channel.send(
			`Re-indexing cases, starting at #${caseNum}... *(This can take a while)*`);

		try { await this.client.mod.logs.fixCases(startCase); }
		catch (err) { return working.edit(err); }

		working.edit('Finished re-indexing cases.');
	}
}
