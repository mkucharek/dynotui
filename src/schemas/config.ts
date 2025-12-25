import { z } from 'zod'

export const appConfigSchema = z.object({
	profile: z.string().optional(),
	region: z.string().optional(),
	pageSize: z.number().int().min(1).max(1000).default(25),
})

export type AppConfig = z.infer<typeof appConfigSchema>

export const cliArgsSchema = z.object({
	profile: z.string().optional(),
	region: z.string().optional(),
	table: z.string().optional(),
})

export type CliArgs = z.infer<typeof cliArgsSchema>
