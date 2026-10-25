# Dependency audit — October 25, 2026

Each folder has an independent npm lockfile. Run `npm audit`, `npm --prefix backend audit`, and `npm --prefix frontend audit` to check all three installations.

Compatible dependency updates reduced the reported totals:

| Installation | Before | After |
| --- | ---: | ---: |
| Root | 7 | 5 high |
| Backend | 2 | 0 |
| Frontend | 15 | 8 (5 high, 3 moderate) |

The updates include the patched body-parser, shell-quote, source-map-js, http-cache-semantics, and Expo config-plugin dependency paths. Backend UUID now uses version 11.1.1 or later in major 11, which supports CommonJS and includes its own TypeScript definitions.

Both root and frontend override only `@expo/ngrok`'s UUID dependency to `^11.1.1`. Ngrok calls `uuid.v4()`, which retains the required API. Keep these overrides until ngrok updates its dependency; do not replace all UUID versions globally.

## Remaining findings

- [node-forge signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv): no patched release is published. Expo CLI and its certificate tooling inherit this finding.
- [Zod constrained collection validation](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): the patched major is 4, but the installed Expo CLI requires major 3. Avoid a forced major override.
- [decode-uri-component denial of service](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr): the patched release is an ES module; Expo Router 57 uses a CommonJS query-string dependency that expects a callable require export. Updating the router requires a coordinated Expo SDK migration.

The root's pre-existing Expo 58 upgrade was preserved. The actual frontend remains on SDK 57; changing the root alone does not migrate the app.

Do not run `npm audit fix --force` to clear these counts: npm suggests incompatible Expo downgrades or an SDK 58 router upgrade. Recheck advisories when Expo publishes compatible fixes. Audit counts can include several parent packages for one underlying issue.
