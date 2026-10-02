// Installs client/ and server/ dependencies. Run from the root postinstall.
// - Uses the npm that is running this script (npm_execpath). Plain `npm` inside a script can
//   resolve to a stray npm in any ancestor node_modules/.bin, which npm adds to PATH.
// - Strips npm_* env vars: nested installs that inherit them (notably npm_config_local_prefix =
//   repo root) install the root package into the subproject.
import { execFileSync } from 'node:child_process'

const npmCli = process.env.npm_execpath
const env = Object.fromEntries(
	Object.entries(process.env).filter(([key]) => !/^npm_/i.test(key)),
)

for (const dir of ['client', 'server']) {
	console.log(`\n> npm install (${dir})`)
	const cwd = new URL(`../${dir}`, import.meta.url)
	if (npmCli) {
		execFileSync(process.execPath, [npmCli, 'install'], { cwd, env, stdio: 'inherit' })
	} else {
		execFileSync('npm', ['install'], { cwd, env, stdio: 'inherit', shell: true })
	}
}
