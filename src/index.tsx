import Pastel from 'pastel'

const app = new Pastel({
	importMeta: import.meta,
	name: 'dynotui',
	version: '0.1.0',
	description: 'DynamoDB TUI client',
})

await app.run()
